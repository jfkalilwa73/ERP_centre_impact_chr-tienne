<?php

namespace App\Http\Controllers\Api\V1\Sprint1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sprint1\StoreRegroupementRequest;
use App\Http\Requests\Sprint1\StoreRelationRequest;
use App\Http\Resources\Sprint1\RegroupementResource;
use App\Http\Resources\Sprint1\RelationResource;
use App\Services\Sprint1\RegroupementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class RegroupementController extends Controller
{
    public function __construct(private RegroupementService $regroupements) {}

    public function showPourPersonne(string $personneId): JsonResponse
    {
        return response()->json((new RegroupementResource($this->regroupements->pourPersonne($personneId)))->resolve());
    }

    public function store(StoreRegroupementRequest $request): JsonResponse
    {
        $famille = $this->regroupements->creer($request->validated());

        return response()->json((new RegroupementResource($famille))->resolve(), Response::HTTP_CREATED);
    }

    public function update(StoreRegroupementRequest $request, string $regroupementId): JsonResponse
    {
        $famille = $this->regroupements->modifier(
            $this->regroupements->trouver($regroupementId),
            $request->validated(),
        );

        return response()->json((new RegroupementResource($famille))->resolve());
    }

    public function storeRelation(StoreRelationRequest $request, string $regroupementId): JsonResponse
    {
        $relation = $this->regroupements->ajouterRelation(
            $this->regroupements->trouver($regroupementId),
            $request->validated(),
        );

        return response()->json((new RelationResource($relation))->resolve(), Response::HTTP_CREATED);
    }

    public function destroyRelation(string $regroupementId, string $relationId): Response
    {
        $this->regroupements->retirerRelation($this->regroupements->trouver($regroupementId), $relationId);

        return response()->noContent();
    }
}
