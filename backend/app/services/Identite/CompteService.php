<?php

namespace App\Services\Identite;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CompteService
{
    public function creer(array $donnees): User
    {
        return DB::transaction(function () use ($donnees) {
            $personne = Personne::query()->find($donnees['id_personne']);

            if (! $personne) {
                abort(404, 'Personne introuvable.');
            }

            if ($personne->user_id !== null) {
                abort(409, 'Cette personne a déjà un compte.');
            }

            if (User::query()->where('email', $donnees['email'])->exists()) {
                abort(409, 'Cet email est déjà utilisé.');
            }

            $user = User::create([
                'name' => trim($personne->prenom.' '.$personne->nom),
                'email' => $donnees['email'],
                'password' => $donnees['password'],
                'mfa_active' => false,
                'statut' => $donnees['statut'] ?? 'actif',
            ]);

            $personne->user_id = $user->id;
            $personne->save();

            return $user;
        });
    }
}