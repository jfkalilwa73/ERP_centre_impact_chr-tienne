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
            $message = $e->getMessage();

            if (str_contains($message, 'Impossible de supprimer une personne active')) {
                abort(409, 'Impossible de supprimer une personne active. Passez d’abord son statut à inactif ou archivé.');
            }

            // Violations FK (23503) : message métier, sans SQL technique.
            if (($e->errorInfo[0] ?? null) === '23503' || str_contains($message, 'Foreign key violation')) {
                if (str_contains($message, 'affecter_departement')) {
                    abort(409, 'Impossible de supprimer cette personne : elle est encore affectée à un département. Retirez d’abord l’affectation.');
                }
                if (str_contains($message, 'appartenir_famille') || str_contains($message, 'affecter_famille')) {
                    abort(409, 'Impossible de supprimer cette personne : elle est encore liée à une famille d’impact. Retirez d’abord le lien.');
                }
                if (str_contains($message, 'membre')) {
                    abort(409, 'Impossible de supprimer cette personne : un dossier membre y est encore lié. Supprimez d’abord le membre.');
                }
                if (str_contains($message, 'relation_familiale')) {
                    abort(409, 'Impossible de supprimer cette personne : elle apparaît encore dans des liens familiaux. Retirez d’abord ces relations.');
                }

                abort(409, 'Impossible de supprimer cette personne : des données y sont encore liées. Retirez d’abord ses affectations et liens.');
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
