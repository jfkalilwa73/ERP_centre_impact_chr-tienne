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

    public function lister(int $page, int $limit, ?string $recherche)
    {
        $requete = Site::query()->orderBy('nom');

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('nom', 'ilike', $terme)
                    ->orWhere('code', 'ilike', $terme)
                    ->orWhere('ville', 'ilike', $terme);
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }

    public function trouver(string $siteId): Site
    {
        return Site::query()->find($siteId) ?? abort(404, 'Site introuvable.');
    }

    public function modifier(Site $site, array $donnees): Site
    {
        if (isset($donnees['code']) && Site::query()->where('code', $donnees['code'])->where('id_site', '!=', $site->id_site)->exists()) {
            abort(409, 'Ce code de site est déjà utilisé.');
        }
        $site->fill($donnees);
        $site->save();
        return $site;
    }

    public function supprimer(Site $site): void
    {
        if ($site->departements()->exists()) abort(409, 'Ce site contient encore des départements.');
        $site->delete();
    }
}
