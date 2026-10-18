<?php

namespace App\Http\Controllers\Api\V1\Famille;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identite\StoreAffectationFamilleRequest;
use App\Http\Resources\Famille\AffectationFamilleResource;
use App\Services\Famille\AffectationFamilleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AffectationFamilleController extends Controller
{
    public function __construct(private AffectationFamilleService $affectations) {}

    public function index(Request $request, string $personneId): JsonResponse
    {
        return response()->json(AffectationFamilleResource::collection(
            $this->affectations->lister($personneId, $request->query('actif'))
        )->resolve());
    }

    public function store(StoreAffectationFamilleRequest $request, string $personneId): JsonResponse
    {
        $affectation = $this->affectations->affecter($personneId, $request->validated());
        return response()->json((new AffectationFamilleResource($affectation))->resolve(), Response::HTTP_CREATED);
    }

    public function destroy(string $personneId, string $familleId): Response
    {
        $this->affectations->cloturer($personneId, $familleId);
        return response()->noContent();
    }
}
