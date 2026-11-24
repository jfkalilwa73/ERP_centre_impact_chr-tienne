<?php

namespace App\Http\Controllers\Api\V1\Famille;

use App\Http\Controllers\Controller;
use App\Http\Requests\Famille\StoreCompositionFamilleDiscipleRequest;
use App\Http\Requests\Famille\StoreFamilleDiscipleRequest;
use App\Http\Requests\Famille\UpdateCompositionFamilleDiscipleRequest;
use App\Http\Resources\Famille\CompositionFamilleDiscipleResource;
use App\Http\Resources\Famille\FamilleDiscipleResource;
use App\Services\Famille\FamilleDiscipleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FamilleDiscipleController extends Controller
{
    public function __construct(private FamilleDiscipleService $familles) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $resultat = $this->familles->lister($page, $limit);

        return response()->json([
            'data' => FamilleDiscipleResource::collection($resultat->items())->resolve(),
            'pagination' => [
                'page' => $resultat->currentPage(),
                'limit' => $resultat->perPage(),
                'total' => $resultat->total(),
            ],
            'modeSimulation' => false,
        ]);
    }

    public function store(StoreFamilleDiscipleRequest $request): JsonResponse
    {
        $famille = $this->familles->creer($request->validated());

        return response()->json((new FamilleDiscipleResource($famille))->resolve(), Response::HTTP_CREATED);
    }

    public function show(string $familleDiscipleId): JsonResponse
    {
        return response()->json(
            (new FamilleDiscipleResource($this->familles->trouver($familleDiscipleId)))->resolve()
        );
    }

    public function storeMembre(StoreCompositionFamilleDiscipleRequest $request, string $familleDiscipleId): JsonResponse
    {
        $composition = $this->familles->admettre($familleDiscipleId, $request->validated());

        return response()->json(
            (new CompositionFamilleDiscipleResource($composition))->resolve(),
            Response::HTTP_CREATED
        );
    }

    public function updateMembre(
        UpdateCompositionFamilleDiscipleRequest $request,
        string $familleDiscipleId,
        string $compositionId,
    ): JsonResponse {
        $composition = $this->familles->modifierComposition(
            $familleDiscipleId,
            $compositionId,
            $request->validated(),
        );

        return response()->json((new CompositionFamilleDiscipleResource($composition))->resolve());
    }

    public function destroyMembre(string $familleDiscipleId, string $compositionId): Response
    {
        $this->familles->retirerComposition($familleDiscipleId, $compositionId);

        return response()->noContent();
    }

    public function showPourPersonne(string $personneId): JsonResponse
    {
        return response()->json($this->familles->pourPersonne($personneId));
    }
}