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

    public function lister(int $page, int $limit, ?string $recherche, ?string $statut)
    {
        $requete = User::query()->with('personne')->orderBy('name');

        if ($statut) {
            $requete->where('statut', $statut);
        }

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('email', 'ilike', $terme)
                    ->orWhere('name', 'ilike', $terme)
                    ->orWhereHas('personne', function ($personne) use ($terme) {
                        $personne->where('nom', 'ilike', $terme)
                            ->orWhere('prenom', 'ilike', $terme);
                    });
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }
}