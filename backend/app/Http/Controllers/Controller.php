<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Documentation API ERP Centre Impact Chrétien",
    description: "API pour la gestion de l'ERP. Authentification SPA : cookie de session Sanctum, pas de Bearer token."
)]
#[OA\Server(
    url: L5_SWAGGER_CONST_HOST,
    description: "Serveur API principal"
)]
#[OA\SecurityScheme(
    securityScheme: "cookieAuth",
    type: "apiKey",
    in: "cookie",
    name: "laravel_session",
    description: "Cookie de session Sanctum (HttpOnly). Après POST /api/v1/auth/login, le navigateur l'envoie tout seul."
)]
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}