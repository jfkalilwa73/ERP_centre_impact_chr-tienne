<?php

namespace App\Http\Controllers\Api\V1\Acces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Acces\StoreRoleRequest;
use App\Http\Resources\Acces\RoleResource;
use App\Services\Acces\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class RoleController extends Controller
{
    public function __construct(
        private RoleService $roles
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));

        $resultat = $this->roles->lister(
            $page,
            $limit,
            $request->query('q'),
        );

        return response()->json([
            'data' => RoleResource::collection($resultat->items())->resolve(),
            'pagination' => [
                'page' => $resultat->currentPage(),
                'limit' => $resultat->perPage(),
                'total' => $resultat->total(),
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/acces/roles',
        summary: 'Créer un rôle métier',
        description: 'Crée un rôle (role_metier). Nécessite une session cookie. Le code doit être unique.',
        tags: ['Accès'],
        security: [['cookieAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['code', 'nom'],
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'ADMIN_FONCTIONNEL'),
                    new OA\Property(property: 'nom', type: 'string', example: 'Administrateur Fonctionnel'),
                    new OA\Property(property: 'description', type: 'string', example: 'Gestion globale de l\'ERP', nullable: true),
                    new OA\Property(property: 'niveau_confidentialite', type: 'integer', example: 3, nullable: true),
                    new OA\Property(property: 'actif', type: 'boolean', example: true, nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Rôle créé'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 409, description: 'Code de rôle déjà utilisé'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roles->creer($request->validated());

        return (new RoleResource($role))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}