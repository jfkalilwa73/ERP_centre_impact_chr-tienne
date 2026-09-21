<?php

namespace App\Services\Identite;

use App\Models\Personne;
use Illuminate\Support\Str;

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
}