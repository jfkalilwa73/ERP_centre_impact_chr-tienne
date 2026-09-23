<?php

namespace App\Services\Organisation;

use App\Models\Site;
use Illuminate\Support\Str;

class SiteService
{
    public function creer(array $donnees): Site
    {
        if (Site::query()->where('code', $donnees['code'])->exists()) {
            abort(409, 'Ce code de site est déjà utilisé.');
        }

        $site = new Site();
        $site->id_site = (string) Str::uuid();
        $site->code = $donnees['code'];
        $site->nom = $donnees['nom'];
        $site->adresse = $donnees['adresse'] ?? null;
        $site->ville = $donnees['ville'] ?? null;
        $site->pays = $donnees['pays'] ?? null;
        $site->telephone = $donnees['telephone'];
        $site->actif = $donnees['actif'] ?? true;
        $site->save();

        return $site;
    }
}