<?php

namespace App\Http\Controllers\Api\V1\Pilotage;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pilotage\UpdatePilotageRequest;
use App\Services\Pilotage\PilotageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PilotageController extends Controller
{
    public function __construct(
        private PilotageService $pilotage
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $this->pilotage->peutLire($user)) {
            abort(403, 'Vous ne pouvez pas consulter le pilotage.');
        }

        return response()->json(['data' => $this->pilotage->tout($user)]);
    }

    public function update(UpdatePilotageRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $this->pilotage->peutEcrire($user)) {
            abort(403, 'Vous ne pouvez pas enregistrer le pilotage.');
        }

        return response()->json([
            'data' => $this->pilotage->enregistrer($user, $request->validated()),
        ]);
    }
}
