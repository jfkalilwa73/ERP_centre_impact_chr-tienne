<?php

namespace App\Http\Controllers\Api\V1\Acces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Acces\StoreAttribuerPermissionRequest;
use App\Http\Resources\Acces\AttribuerPermissionResource;
use App\Http\Resources\Acces\PermissionResource;
use App\Models\RoleMetier;
use App\Services\Acces\AttribuerPermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class AttribuerPermissionController extends Controller
{
    public function __construct(
        private AttribuerPermissionService $attributions
    ) {}
    public function index(string $roleId): JsonResponse
    {
        $permissions = $this->attributions->lister($roleId);

        return response()->json(
            PermissionResource::collection($permissions)->resolve()
        );
    }
    #[OA\Post(
        path: '/api/v1/acces/roles/{role}/permissions',
        summary: 'Attribuer une permission à un rôle',
        description: 'Lie une permission à un rôle dans attribuer_permission. Nécessite une session cookie. {role} est l\'UUID id_role.',
        tags: ['Accès'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'role',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid', example: '63c18b33-2f90-4d2e-a12a-8147bfe50d5b')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['id_permission'],
                properties: [
                    new OA\Property(property: 'id_permission', type: 'string', format: 'uuid', example: '11111111-1111-1111-1111-111111111111'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Permission attribuée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Rôle ou permission introuvable'),
            new OA\Response(response: 409, description: 'Permission déjà attribuée à ce rôle'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreAttribuerPermissionRequest $request, RoleMetier $role): JsonResponse
    {
        $attribution = $this->attributions->attribuer($role, $request->validated());

        return response()->json(
            (new PermissionResource($attribution->permission))->resolve(),
            Response::HTTP_CREATED
        );
    }
}