<?php

namespace App\Http\Controllers\Api\V1\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Organisation\StoreDepartementRequest;
use App\Http\Resources\Organisation\DepartementResource;
use App\Services\Organisation\DepartementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class DepartementController extends Controller
{
    public function __construct(
        private DepartementService $departements
    ) {}

    #[OA\Post(
        path: '/api/v1/organisation/departements',
        summary: 'Créer un département',
        description: 'Crée un département rattaché à un site existant. Nécessite une session cookie. Le code doit être unique.',
        tags: ['Organisation'],
        security: [['cookieAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['code', 'nom', 'id_site'],
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'DEPT-ACCUEIL'),
                    new OA\Property(property: 'nom', type: 'string', example: 'Département Accueil'),
                    new OA\Property(property: 'id_site', type: 'string', format: 'uuid', example: '11111111-1111-1111-1111-111111111111'),
                    new OA\Property(property: 'mission', type: 'string', example: 'Accueil des membres et visiteurs', nullable: true),
                    new OA\Property(property: 'actif', type: 'boolean', example: true, nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Département créé'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Site introuvable'),
            new OA\Response(response: 409, description: 'Code de département déjà utilisé'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreDepartementRequest $request): JsonResponse
    {
        $departement = $this->departements->creer($request->validated());

        return (new DepartementResource($departement))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}