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
            'statut' => 'actif',
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
}