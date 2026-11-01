<?php

namespace App\Http\Controllers\Api\V1\Sprint1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sprint1\StoreMembreRequest;
use App\Http\Requests\Sprint1\UpdateMembreStatutRequest;
use App\Http\Resources\Sprint1\HistoriqueStatutResource;
use App\Http\Resources\Sprint1\MembreResource;
use App\Services\Sprint1\MembreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MembreController extends Controller
{
    public function __construct(private MembreService $membres) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $result = $this->membres->lister($page, $limit, $request->query('q'), $request->query('statut'));

        return response()->json([
            'data' => MembreResource::collection($result->items())->resolve(),
            'pagination' => [
                'page' => $result->currentPage(),
                'limit' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function showPourPersonne(string $personneId): JsonResponse
    {
        $membre = $this->membres->pourPersonne($personneId)->load('personne');

        return response()->json((new MembreResource($membre))->resolve());
    }

    public function store(StoreMembreRequest $request, string $personneId): JsonResponse
    {
        $membre = $this->membres->creer($personneId, $request->validated())->load('personne');

        return response()->json((new MembreResource($membre))->resolve(), Response::HTTP_CREATED);
    }

    public function updateStatut(UpdateMembreStatutRequest $request, string $membreId): JsonResponse
    {
        $donnees = $request->validated();
        $membre = $this->membres->changerStatut(
            $this->membres->trouver($membreId),
            $donnees['statut_membre'],
            $donnees['motif'] ?? null,
            $request->user()?->id,
        )->load('personne');

        return response()->json((new MembreResource($membre))->resolve());
    }

    public function historique(string $membreId): JsonResponse
    {
        $lignes = $this->membres->historique($this->membres->trouver($membreId));

        return response()->json(HistoriqueStatutResource::collection($lignes)->resolve());
    }
}
