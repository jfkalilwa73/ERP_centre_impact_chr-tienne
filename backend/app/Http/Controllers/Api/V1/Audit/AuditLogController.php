<?php

namespace App\Http\Controllers\Api\V1\Audit;

use App\Http\Controllers\Controller;
use App\Http\Resources\Audit\AuditLogResource;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AuditLogController extends Controller
{
    public function __construct(
        private AuditLogService $audits
    ) {}

    #[OA\Get(
        path: '/api/v1/audit/logs',
        summary: 'Consulter les traces d\'audit',
        description: 'Lecture seule. Les traces sont écrites côté serveur, jamais par le client.',
        tags: ['Audit'],
        security: [['cookieAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Liste des traces'),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));

        $resultat = $this->audits->lister(
            $page,
            $limit,
            $request->query('action'),
            $request->query('entiteType'),
        );

        return response()->json([
            'data' => AuditLogResource::collection($resultat->items())->resolve(),
            'pagination' => [
                'page' => $resultat->currentPage(),
                'limit' => $resultat->perPage(),
                'total' => $resultat->total(),
            ],
        ]);
    }
}