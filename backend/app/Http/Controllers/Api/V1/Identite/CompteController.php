<?php

namespace App\Http\Controllers\Api\V1\Identite;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identite\StoreCompteRequest;
use App\Http\Requests\Identite\UpdateCompteRequest;
use App\Http\Resources\Identite\CompteResource;
use App\Services\Identite\CompteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class CompteController extends Controller
{
    public function __construct(
        private CompteService $comptes
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));

        $resultat = $this->comptes->lister(
            $page,
            $limit,
            $request->query('q'),
            $request->query('statut'),
        );

        return response()->json([
            'data' => CompteResource::collection($resultat->items())->resolve(),
            'pagination' => [
                'page' => $resultat->currentPage(),
                'limit' => $resultat->perPage(),
                'total' => $resultat->total(),
            ],
        ]);
    }
    public function show(string $compteId): JsonResponse
    {
        $compte = $this->comptes->trouver($compteId);

        return response()->json((new CompteResource($compte))->resolve());
    }

    public function update(UpdateCompteRequest $request, string $compteId): JsonResponse
    {
        $compte = $this->comptes->modifier($this->comptes->trouver($compteId), $request->validated());
        return response()->json((new CompteResource($compte))->resolve());
    }

    public function destroy(string $compteId): Response
    {
        $this->comptes->supprimer($this->comptes->trouver($compteId));
        return response()->noContent();
    }

    #[OA\Post(
        path: '/api/v1/identite/comptes',
        summary: 'Créer un compte de connexion',
        description: 'Crée un User Laravel et le lie à une personne existante. Nécessite une session cookie. Le mot de passe n\'est jamais renvoyé.',
        tags: ['Identité'],
        security: [['cookieAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['id_personne', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'id_personne', type: 'string', format: 'uuid', example: '849ba161-9f40-440c-ada3-2ebbb1279944'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'bienvenu.karagi@eglise-upn.org'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Secret123!'),
                    new OA\Property(property: 'statut', type: 'string', enum: ['actif', 'suspendu', 'desactive'], example: 'actif', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Compte créé'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Personne introuvable'),
            new OA\Response(response: 409, description: 'Personne déjà liée ou email déjà utilisé'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreCompteRequest $request): JsonResponse
    {
        $user = $this->comptes->creer($request->validated());

        return response()->json(
            (new CompteResource($user))->resolve(),
            Response::HTTP_CREATED
        );
    }
}
