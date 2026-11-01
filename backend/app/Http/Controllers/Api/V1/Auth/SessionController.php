<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\Auth\SessionResource;
use App\Services\Auth\SessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;




class SessionController extends Controller
{
    public function __construct(
        private SessionService $sessions
    ) {}

    #[OA\Post(
        path: '/api/v1/auth/login',
        summary: 'Connexion',
        description: 'Ouvre une session cookie Sanctum. Aucun token n\'est renvoyé.',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'elieilunga007@gmail.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Session créée',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Administrateur fonctionnel'),
                                new OA\Property(property: 'email', type: 'string', example: 'elieilunga007@gmail.com'),
                                new OA\Property(property: 'statut', type: 'string', example: 'actif'),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Identifiants incorrects ou champs invalides'),
        ]
    )]
    public function login(LoginRequest $request): SessionResource
    {
        $user = $this->sessions->login(
            $request->validated('email'),
            $request->validated('password')
        );

        return new SessionResource($user);
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        summary: 'Déconnexion',
        description: 'Détruit la session cookie. Aucun body.',
        tags: ['Auth'],
        security: [['cookieAuth' => []]],
        responses: [
            new OA\Response(response: 204, description: 'Session détruite'),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    public function logout(): Response
    {
        $this->sessions->logout();

        return response()->noContent();
    }

    #[OA\Get(
        path: '/api/v1/auth/me',
        summary: 'Utilisateur connecté',
        description: 'Retourne le profil de la session courante. Aucun token.',
        tags: ['Auth'],
        security: [['cookieAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profil de la session',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Administrateur fonctionnel'),
                                new OA\Property(property: 'email', type: 'string', example: 'elieilunga007@gmail.com'),
                                new OA\Property(property: 'statut', type: 'string', example: 'actif'),
                            ],
                            type: 'object'
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    public function me(Request $request): SessionResource
    {
        return new SessionResource($request->user());
    }
}
