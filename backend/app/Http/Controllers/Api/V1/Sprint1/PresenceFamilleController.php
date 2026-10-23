<?php

namespace App\Http\Controllers\Api\V1\Sprint1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sprint1\StorePresencesRequest;
use App\Http\Resources\Sprint1\AffectationMembreResource;
use App\Http\Resources\Sprint1\PresenceResource;
use App\Services\Sprint1\SuiviMembreService;
use Illuminate\Http\JsonResponse;

class PresenceFamilleController extends Controller
{
    public function __construct(private SuiviMembreService $suivi) {}

    public function synchroniser(string $familleId): JsonResponse
    {
        return response()->json([
            'affectations' => AffectationMembreResource::collection($this->suivi->synchroniserFamille($familleId))->resolve(),
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
