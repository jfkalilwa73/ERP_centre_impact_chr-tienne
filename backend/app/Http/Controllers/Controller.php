<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Documentation API ERP Centre Impact Chrétien",
    description: "API pour la gestion de l'ERP"
)]
#[OA\Server(
    url: L5_SWAGGER_CONST_HOST,
    description: "Serveur API principal"
)]
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}