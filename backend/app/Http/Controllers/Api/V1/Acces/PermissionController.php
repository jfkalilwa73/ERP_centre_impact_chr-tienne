<?php

namespace App\Http\Controllers\Api\V1\Acces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Acces\StorePermissionRequest;
use App\Http\Resources\Acces\PermissionResource;
use App\Services\Acces\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class PermissionController extends Controller
{
    public function __construct(
        private PermissionService $permissions
    ) {}

    #[OA\Post(
        path: '/api/v1/acces/permissions',
        summary: 'Créer une permission',
        description: 'Crée une permission métier (permission_metier). Nécessite une session cookie. Le code et le couple module+action doivent être uniques.',
        tags: ['Accès'],
        security: [['cookieAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['code', 'module', 'action'],
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'finances.read'),
                    new OA\Property(property: 'module', type: 'string', example: 'finances'),
                    new OA\Property(property: 'action', type: 'string', example: 'read'),
                    new OA\Property(property: 'description', type: 'string', example: 'Consulter les données financières', nullable: true),
                    new OA\Property(property: 'actif', type: 'boolean', example: true, nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Permission créée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 409, description: 'Code ou couple module+action déjà utilisé'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = $this->permissions->creer($request->validated());

        return (new PermissionResource($permission))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}