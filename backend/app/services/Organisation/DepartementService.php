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

    public function lister(int $page, int $limit, ?string $recherche, ?string $siteId)
    {
        $requete = Departement::query()->orderBy('nom');

        if ($siteId) {
            $requete->where('id_site', $siteId);
        }

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('nom', 'ilike', $terme)
                    ->orWhere('code', 'ilike', $terme)
                    ->orWhere('mission', 'ilike', $terme);
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }

    public function trouver(string $departementId): Departement
    {
        return Departement::query()->find($departementId) ?? abort(404, 'Département introuvable.');
    }

    public function modifier(Departement $departement, array $donnees): Departement
    {
        if (isset($donnees['id_site']) && ! Site::query()->whereKey($donnees['id_site'])->exists()) abort(404, 'Site introuvable.');
        if (isset($donnees['code']) && Departement::query()->where('code', $donnees['code'])->where('id_departement', '!=', $departement->id_departement)->exists()) {
            abort(409, 'Ce code de département est déjà utilisé.');
        }
        $departement->fill($donnees);
        $departement->save();
        return $departement;
    }

    public function supprimer(Departement $departement): void
    {
        if ($departement->affectations()->exists()) abort(409, 'Ce département a un historique d’affectations et ne peut pas être supprimé.');
        $departement->delete();
    }
}
