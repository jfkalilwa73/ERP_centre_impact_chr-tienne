<?php

namespace App\Http\Controllers\Api\V1\Acces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Acces\StoreAffectationRoleRequest;
use App\Http\Resources\Acces\AffectationRoleResource;
use App\Models\User;
use App\Services\Acces\AffectationRoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class AffectationRoleController extends Controller
{
    public function __construct(
        private AffectationRoleService $affectations
    ) {}

    #[OA\Post(
        path: '/api/v1/acces/comptes/{user}/roles',
        summary: 'Attribuer un rôle à un compte',
        description: 'Crée une affectation active dans affecter_role_metier. Nécessite une session cookie. {user} est l\'id numérique du compte Laravel.',
        tags: ['Accès'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'user',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer', example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['id_role'],
                properties: [
                    new OA\Property(property: 'id_role', type: 'string', format: 'uuid', example: '63c18b33-2f90-4d2e-a12a-8147bfe50d5b'),
                    new OA\Property(property: 'date_debut', type: 'string', format: 'date-time', nullable: true),
                    new OA\Property(property: 'date_fin', type: 'string', format: 'date-time', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Rôle attribué'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Compte ou rôle introuvable'),
            new OA\Response(response: 409, description: 'Rôle déjà attribué à ce compte'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function index(string $compteId): JsonResponse
    {
        $affectations = $this->affectations->lister($compteId);

        return response()->json(
            AffectationRoleResource::collection($affectations)->resolve()
        );
    }
    public function store(StoreAffectationRoleRequest $request, User $user): JsonResponse
    {
        $affectation = $this->affectations->attribuer($user, $request->validated());

        return response()->json(
            (new AffectationRoleResource($affectation))->resolve(),
            Response::HTTP_CREATED
        );
    }
}