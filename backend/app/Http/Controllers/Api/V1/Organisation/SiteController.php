<?php

namespace App\Http\Controllers\Api\V1\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Organisation\StoreSiteRequest;
use App\Http\Resources\Organisation\SiteResource;
use App\Services\Organisation\SiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class SiteController extends Controller
{
    public function __construct(
        private SiteService $sites
    ) {}

    #[OA\Post(
        path: '/api/v1/organisation/sites',
        summary: 'Créer un site',
        description: 'Crée un site (campus / lieu). Nécessite une session cookie. Le code doit être unique.',
        tags: ['Organisation'],
        security: [['cookieAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['code', 'nom', 'telephone'],
                properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'SITE-GOMBE-01'),
                    new OA\Property(property: 'nom', type: 'string', example: 'Site Gombe'),
                    new OA\Property(property: 'telephone', type: 'string', example: '+243810000002'),
                    new OA\Property(property: 'adresse', type: 'string', example: 'Boulevard du 30 Juin, Gombe', nullable: true),
                    new OA\Property(property: 'ville', type: 'string', example: 'Kinshasa', nullable: true),
                    new OA\Property(property: 'pays', type: 'string', example: 'RDC', nullable: true),
                    new OA\Property(property: 'actif', type: 'boolean', example: true, nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Site créé'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 409, description: 'Code de site déjà utilisé'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreSiteRequest $request): JsonResponse
    {
        $site = $this->sites->creer($request->validated());

        return (new SiteResource($site))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}