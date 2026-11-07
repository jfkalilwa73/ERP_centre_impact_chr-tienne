<?php

namespace App\Http\Controllers\Api\V1\Identite;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identite\StoreMembreRequest;
use App\Http\Resources\Identite\MembreResource;
use App\Services\Audit\AuditLogService;
use App\Services\Identite\MembreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use App\Http\Requests\Identite\UpdateMembreStatutRequest;
use App\Http\Resources\Identite\HistoriqueStatutResource;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class MembreController extends Controller
{
    public function __construct(
        private MembreService $membres,
        private AuditLogService $audits,
    ) {}

    #[OA\Get(
        path: '/api/v1/membres',
        summary: 'Lister les membres',
        description: 'Liste paginée. Filtres : q (nom, prénom, numéro), statut ou statutMembre. Session cookie Sanctum.',
        tags: ['Identité'],
        security: [['cookieAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', example: 1)),
            new OA\Parameter(name: 'limit', in: 'query', schema: new OA\Schema(type: 'integer', example: 20)),
            new OA\Parameter(name: 'q', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'statut', in: 'query', schema: new OA\Schema(type: 'string', enum: ['actif', 'inactif', 'en_attente', 'archive'])),
            new OA\Parameter(name: 'statutMembre', in: 'query', schema: new OA\Schema(type: 'string', enum: ['actif', 'inactif', 'en_attente', 'archive'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liste paginée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 422, description: 'Statut inconnu'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $statut = $request->query('statutMembre') ?? $request->query('statut');

        $resultat = $this->membres->lister(
            $page,
            $limit,
            $request->query('q'),
            is_string($statut) ? $statut : null,
        );

        return response()->json([
            'data' => MembreResource::collection($resultat->items())->resolve(),
            'pagination' => [
                'page' => $resultat->currentPage(),
                'limit' => $resultat->perPage(),
                'total' => $resultat->total(),
            ],
        ]);
    }

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

    public function updateStatut(UpdateMembreStatutRequest $request, string $membreId): JsonResponse
    {
        $donnees = $request->validated();
        $membre = $this->membres->trouver($membreId);
        $ancien = $membre->statut_membre;

        $membre = $this->membres->changerStatut(
            $membre,
            $donnees['statut_membre'],
            $donnees['motif'] ?? null,
            $request->user()?->id,
        )->load('personne');

        $this->audits->enregistrer([
            'user_id' => $request->user()?->id,
            'action' => 'MEMBRE_STATUS_CHANGED',
            'entite_type' => 'membre',
            'id_entite' => $membre->id_membre,
            'anciennes_valeurs' => ['statutMembre' => $ancien],
            'nouvelles_valeurs' => [
                'statutMembre' => $membre->statut_membre,
                'motif' => $membre->motif_changement_statut,
            ],
            'adresse_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json((new MembreResource($membre))->resolve());
    }

    public function historique(string $membreId): JsonResponse
    {
        $lignes = $this->membres->historique($this->membres->trouver($membreId));

        return response()->json(HistoriqueStatutResource::collection($lignes)->resolve());
    }
}