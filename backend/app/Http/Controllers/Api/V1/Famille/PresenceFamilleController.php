<?php

namespace App\Http\Controllers\Api\V1\Famille;

use App\Http\Controllers\Controller;
use App\Http\Requests\Famille\StorePresencesRequest;
use App\Http\Resources\Famille\AffectationMembreResource;
use App\Http\Resources\Famille\PresenceResource;
use App\Services\Famille\SuiviMembreService;
use Illuminate\Http\JsonResponse;

class PresenceFamilleController extends Controller
{
    public function __construct(private SuiviMembreService $suivi) {}

    public function synchroniser(string $familleId): JsonResponse
    {
        return response()->json([
            'affectations' => AffectationMembreResource::collection(
                $this->suivi->synchroniserFamille($familleId)
            )->resolve(),
        ]);
    }

    public function index(string $familleId): JsonResponse
    {
        $resultat = $this->suivi->presences($familleId);

        return response()->json([
            'affectations' => AffectationMembreResource::collection($resultat['affectations'])->resolve(),
            'presences' => PresenceResource::collection($resultat['presences'])->resolve(),
        ]);
    }

    public function store(StorePresencesRequest $request, string $familleId): JsonResponse
    {
        $donnees = $request->validated();
        $resultat = $this->suivi->enregistrerPresences(
            $familleId,
            $donnees['date_reunion'],
            $donnees['lignes'],
            $request->user()?->id,
        );

        return response()->json([
            'affectations' => AffectationMembreResource::collection($resultat['affectations'])->resolve(),
            'presences' => PresenceResource::collection($resultat['presences'])->resolve(),
        ]);
    }
}