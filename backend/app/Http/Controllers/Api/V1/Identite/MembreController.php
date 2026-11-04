<?php

namespace App\Http\Controllers\Api\V1\Identite;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identite\StoreMembreRequest;
use App\Http\Resources\Identite\MembreResource;
use App\Services\Audit\AuditLogService;
use App\Services\Identite\MembreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

class MembreController extends Controller
{
    public function __construct(
        private MembreService $membres,
        private AuditLogService $audits,
    ) {}

    #[OA\Post(
        path: '/api/v1/personnes/{personneId}/membre',
        summary: 'Enregistrer une personne comme membre',
        description: 'Crée le dossier membre 1:1. Le numéro MEM-AAAA-NNNN est généré par trigger PostgreSQL. Session cookie Sanctum.',
        tags: ['Identité'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'personneId',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['dateIntegration'],
                properties: [
                    new OA\Property(property: 'dateIntegration', type: 'string', format: 'date', example: '2026-01-15'),
                    new OA\Property(property: 'statutMembre', type: 'string', enum: ['actif', 'inactif', 'en_attente', 'archive'], example: 'en_attente'),
                    new OA\Property(property: 'familleImpactId', type: 'string', format: 'uuid', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Membre créé'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Personne introuvable'),
            new OA\Response(response: 409, description: 'Déjà membre'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(StoreMembreRequest $request, string $personneId): JsonResponse
    {
        $membre = $this->membres->creer($personneId, $request->validated())->load('personne');

        $this->audits->enregistrer([
            'user_id' => $request->user()?->id,
            'action' => 'MEMBRE_CREATED',
            'entite_type' => 'membre',
            'id_entite' => $membre->id_membre,
            'nouvelles_valeurs' => [
                'idPersonne' => $membre->id_personne,
                'numeroMembre' => $membre->numero_membre,
                'dateIntegration' => $membre->date_integration?->toDateString(),
                'statutMembre' => $membre->statut_membre,
            ],
            'adresse_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json((new MembreResource($membre))->resolve(), Response::HTTP_CREATED);
    }

    public function showPourPersonne(string $personneId): JsonResponse
    {
        $membre = $this->membres->pourPersonne($personneId)->load('personne');

        return response()->json((new MembreResource($membre))->resolve());
    }
}