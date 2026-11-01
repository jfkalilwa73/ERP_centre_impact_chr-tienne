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

    public function trouver(string $compteId): User
    {
        $compte = User::query()->find($compteId);

        if ($compte === null) {
            abort(404, 'Compte introuvable.');
        }

        return $compte;
    }

    public function modifier(User $compte, array $donnees): User
    {
        if (array_key_exists('mfaActive', $donnees)) {
            $donnees['mfa_active'] = $donnees['mfaActive'];
            unset($donnees['mfaActive']);
        }
        if (array_key_exists('statut', $donnees)) {
            $donnees['date_desactivation'] = $donnees['statut'] === 'actif' ? null : now();
        }
        $compte->fill($donnees);
        $compte->save();
        return $compte->fresh();
    }

    public function supprimer(User $compte): void
    {
        if ($compte->statut === 'actif') abort(409, 'Un compte actif ne peut pas être supprimé. Désactivez-le avant.');

        DB::transaction(function () use ($compte) {
            $compte->tokensMetier()->delete();
            DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $compte->id)->delete();
            \App\Models\AffecterRoleMetier::query()->where('user_id', $compte->id)->delete();
            $compte->personne()->update(['user_id' => null]);
            $compte->delete();
        });
    }
}
