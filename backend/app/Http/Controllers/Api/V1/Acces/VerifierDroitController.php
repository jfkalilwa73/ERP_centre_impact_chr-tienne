<?php

namespace App\Http\Controllers\Api\V1\Acces;

use App\Http\Controllers\Controller;
use App\Http\Resources\Acces\DroitResource;
use App\Models\User;
use App\Services\Acces\VerifierDroitService;
use OpenApi\Attributes as OA;

class VerifierDroitController extends Controller
{
    public function __construct(
        private VerifierDroitService $droits
    ) {}

    #[OA\Get(
        path: '/api/v1/acces/comptes/{user}/permissions/{permissionCode}',
        summary: 'Vérifier le droit d\'un compte',
        description: 'Vérifie si le compte a la permission via un rôle actif. {user} est l\'id numérique. {permissionCode} est du type membres.read.',
        tags: ['Accès'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'user',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer', example: 1)
            ),
            new OA\Parameter(
                name: 'permissionCode',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'membres.read')
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Résultat de la vérification'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Compte introuvable'),
        ]
    )]
    public function show(User $user, string $permissionCode): DroitResource
    {
        return new DroitResource(
            $this->droits->verifier($user, $permissionCode)
        );
    }
}