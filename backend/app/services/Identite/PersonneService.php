<?php

namespace App\Services\Identite;

use App\Models\Personne;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class PersonneService
{
    public function creer(array $donnees): Personne
    {
        return Personne::create([
            'id_personne' => (string) Str::uuid(),
            'nom' => $donnees['nom'],
            'prenom' => $donnees['prenom'],
            'date_naissance' => $donnees['date_naissance'] ?? null,
            'sexe' => $donnees['sexe'] ?? null,
            'telephone' => $donnees['telephone'] ?? null,
            'adresse' => $donnees['adresse'] ?? null,
            'photo_url' => $donnees['photo_url'] ?? null,
            'statut' => $donnees['statut'] ?? 'actif',
        ]);
    }
    public function supprimer(Personne $personne): void
    {
        try {
            DB::transaction(function () use ($personne) {
                $personne->delete();
            });
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Impossible de supprimer une personne active')) {
                abort(409, 'Impossible de supprimer une personne active.');
            }

            throw $e;
        }
    }

    public function modifier(Personne $personne, array $donnees): Personne
    {
        $personne->fill($donnees);
        $personne->save();

        return $personne;
    }

    public function lister(int $page, int $limit, ?string $recherche, ?string $statut)
    {
        $requete = Personne::query()->orderBy('nom')->orderBy('prenom');

        if ($statut) {
            $requete->where('statut', $statut);
        }

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('nom', 'ilike', $terme)
                    ->orWhere('prenom', 'ilike', $terme)
                    ->orWhere('telephone', 'ilike', $terme);
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }

    public function trouver(string $personneId): Personne
    {
        $personne = Personne::query()->find($personneId);

        if ($personne === null) {
            abort(404, 'Personne introuvable.');
        }

        return $personne;
    }
}
