<?php

namespace App\Http\Controllers\Api\V1\Identite;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identite\StorePersonneRequest;
use App\Http\Requests\Identite\UpdatePersonneRequest;
use App\Http\Resources\Identite\PersonneResource;
use App\Models\Personne;
use App\Services\Identite\PersonneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class PersonneController extends Controller
{
    public function __construct(
        private PersonneService $personnes
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));

        $resultat = $this->personnes->lister(
            $page,
            $limit,
            $request->query('q'),
            $request->query('statut'),
        );

        return response()->json([
            'data' => PersonneResource::collection($resultat->items())->resolve(),
            'pagination' => [
                'page' => $resultat->currentPage(),
                'limit' => $resultat->perPage(),
                'total' => $resultat->total(),
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/identite/personnes',
        summary: 'Créer une personne',
        description: 'Crée une fiche personne sans compte de connexion. Nécessite une session cookie.',
        tags: ['Identité'],
        security: [['cookieAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['nom', 'prenom'],
                properties: [
                    new OA\Property(property: 'nom', type: 'string', example: 'Nuru'),
                    new OA\Property(property: 'prenom', type: 'string', example: 'Jean'),
                    new OA\Property(property: 'date_naissance', type: 'string', format: 'date', example: '1990-05-15', nullable: true),
                    new OA\Property(property: 'sexe', type: 'string', enum: ['M', 'F'], example: 'M', nullable: true),
                    new OA\Property(property: 'telephone', type: 'string', example: '+243819999999', nullable: true),
                    new OA\Property(property: 'adresse', type: 'string', example: 'Mont-Ngafula, Kinshasa', nullable: true),
                    new OA\Property(property: 'photo_url', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Personne créée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StorePersonneRequest $request): JsonResponse
    {
        $personne = $this->personnes->creer($request->validated());

        return (new PersonneResource($personne))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(string $personneId): JsonResponse
    {
        $personne = $this->personnes->trouver($personneId);

        return response()->json((new PersonneResource($personne))->resolve());
    }

    public function update(UpdatePersonneRequest $request, string $personneId): JsonResponse
    {
        $personne = $this->personnes->trouver($personneId);
        $personne = $this->personnes->modifier($personne, $request->validated());

        return response()->json((new PersonneResource($personne))->resolve());
    }

    #[OA\Delete(
        path: '/api/v1/identite/personnes/{personne}',
        summary: 'Supprimer une personne inactive ou archivée',
        description: 'Le trigger PostgreSQL interdit la suppression si le statut est actif.',
        tags: ['Identité'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'personne',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Personne supprimée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Personne introuvable'),
            new OA\Response(response: 409, description: 'Personne encore active'),
        ]
    )]
    public function destroy(Personne $personne): Response
    {
        $this->personnes->supprimer($personne);

        return response()->noContent();
    }
}
