<?php

namespace App\Http\Controllers\Api\V1\Identite;

use App\Http\Controllers\Controller;
use App\Http\Requests\Identite\StorePersonnePhotoRequest;
use App\Http\Resources\Identite\PersonneResource;
use App\Services\Identite\PersonneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PersonnePhotoController extends Controller
{
    public function __construct(
        private PersonneService $personnes,
    ) {}

    public function store(StorePersonnePhotoRequest $request, string $personneId): JsonResponse
    {
        $personne = $this->personnes->trouver($personneId);
        $disk = Storage::disk();
        $prefix = "personnes/{$personne->id_personne}/";
        $path = $request->file('photo')->store($prefix);

        if ($path === false) {
            abort(500, 'Le stockage de la photo a échoué.');
        }

        $ancienPath = $personne->photo_url;
        $personne->photo_url = $path;
        $personne->save();

        if (is_string($ancienPath) && str_starts_with($ancienPath, $prefix) && $ancienPath !== $path) {
            if (! $disk->delete($ancienPath)) {
                Log::warning('Impossible de supprimer l’ancienne photo de profil.', [
                    'personne_id' => $personne->id_personne,
                    'photo_path' => $ancienPath,
                ]);
            }
        }

        return response()->json((new PersonneResource($personne))->resolve());
    }

    public function show(string $personneId): StreamedResponse
    {
        $personne = $this->personnes->trouver($personneId);
        $prefix = "personnes/{$personne->id_personne}/";
        $path = $personne->photo_url;

        if (! is_string($path) || ! str_starts_with($path, $prefix) || ! Storage::disk()->exists($path)) {
            abort(404, 'Photo de profil introuvable.');
        }

        return Storage::disk()->response(
            $path,
            null,
            ['Cache-Control' => 'private, max-age=604800'],
            'inline',
        );
    }
}
