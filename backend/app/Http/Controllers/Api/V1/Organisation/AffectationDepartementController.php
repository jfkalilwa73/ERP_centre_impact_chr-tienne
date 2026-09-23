<?php

namespace App\Http\Controllers\Api\V1\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Organisation\StoreAffectationDepartementRequest;
use App\Http\Resources\Organisation\AffectationDepartementResource;
use App\Models\Personne;
use App\Services\Organisation\AffectationDepartementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class AffectationDepartementController extends Controller
{
    public function __construct(
        private AffectationDepartementService $affectations
    ) {}

    #[OA\Post(
        path: '/api/v1/organisation/personnes/{personne}/departements',
        summary: 'Affecter une personne à un département',
        description: 'Crée une affectation active dans affecter_departement. Nécessite une session cookie. {personne} est l\'UUID id_personne.',
        tags: ['Organisation'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'personne',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid', example: '849ba161-9f40-440c-ada3-2ebbb1279944')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['id_departement'],
                properties: [
                    new OA\Property(property: 'id_departement', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'fonction', type: 'string', example: 'Responsable accueil', nullable: true),
                    new OA\Property(property: 'date_debut', type: 'string', format: 'date-time', nullable: true),
                    new OA\Property(property: 'date_fin', type: 'string', format: 'date-time', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Affectation créée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Personne ou département introuvable'),
            new OA\Response(response: 409, description: 'Personne déjà affectée à ce département'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreAffectationDepartementRequest $request, Personne $personne): JsonResponse
    {
        $affectation = $this->affectations->affecter($personne, $request->validated());

        return (new AffectationDepartementResource($affectation))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}