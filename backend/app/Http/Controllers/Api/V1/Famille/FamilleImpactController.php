<?php

namespace App\Http\Controllers\Api\V1\Famille;

use App\Http\Controllers\Controller;
use App\Http\Requests\Famille\StoreFamilleImpactRequest;
use App\Http\Requests\Famille\UpdateFamilleImpactRequest;
use App\Http\Resources\Famille\FamilleImpactResource;
use App\Services\Famille\FamilleImpactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FamilleImpactController extends Controller
{
    public function __construct(private FamilleImpactService $familles) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $result = $this->familles->lister($page, $limit, $request->query('q'));
        return response()->json([
            'data' => FamilleImpactResource::collection($result->items())->resolve(),
            'pagination' => ['page' => $result->currentPage(), 'limit' => $result->perPage(), 'total' => $result->total()],
        ]);
    }

    public function store(StoreFamilleImpactRequest $request): JsonResponse
    {
        $famille = $this->familles->creer($request->validated());
        return response()->json((new FamilleImpactResource($famille))->resolve(), Response::HTTP_CREATED);
    }

    public function show(string $familleId): JsonResponse
    {
        return response()->json((new FamilleImpactResource($this->familles->trouver($familleId)))->resolve());
    }

    public function update(UpdateFamilleImpactRequest $request, string $familleId): JsonResponse
    {
        $famille = $this->familles->modifier($this->familles->trouver($familleId), $request->validated());
        return response()->json((new FamilleImpactResource($famille))->resolve());
    }

    public function destroy(string $familleId): Response
    {
        $this->familles->supprimer($this->familles->trouver($familleId));
        return response()->noContent();
    }
}
