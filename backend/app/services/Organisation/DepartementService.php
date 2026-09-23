<?php

namespace App\Services\Organisation;

use App\Models\Departement;
use App\Models\Site;
use Illuminate\Support\Str;

class DepartementService
{
    public function creer(array $donnees): Departement
    {
        $site = Site::query()->find($donnees['id_site']);

        if (! $site) {
            abort(404, 'Site introuvable.');
        }

        if (Departement::query()->where('code', $donnees['code'])->exists()) {
            abort(409, 'Ce code de département est déjà utilisé.');
        }

        $departement = new Departement();
        $departement->id_departement = (string) Str::uuid();
        $departement->code = $donnees['code'];
        $departement->nom = $donnees['nom'];
        $departement->mission = $donnees['mission'] ?? null;
        $departement->id_site = $site->id_site;
        $departement->actif = $donnees['actif'] ?? true;
        $departement->save();

        return $departement;
    }
}