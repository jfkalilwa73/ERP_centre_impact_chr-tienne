<?php

namespace App\Services\Acces;

use App\Models\RoleMetier;
use Illuminate\Support\Str;

class RoleService
{
    public function creer(array $donnees): RoleMetier
    {
        if (RoleMetier::query()->where('code', $donnees['code'])->exists()) {
            abort(409, 'Ce code de rôle est déjà utilisé.');
        }

        $role = new RoleMetier();
        $role->id_role = (string) Str::uuid();
        $role->code = $donnees['code'];
        $role->nom = $donnees['nom'];
        $role->description = $donnees['description'] ?? null;
        $role->niveau_confidentialite = $donnees['niveau_confidentialite'] ?? 1;
        $role->actif = $donnees['actif'] ?? true;
        $role->save();

        return $role;
    }

    public function lister(int $page, int $limit, ?string $recherche)
    {
        $requete = RoleMetier::query()->orderBy('nom');

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('nom', 'ilike', $terme)
                    ->orWhere('code', 'ilike', $terme);
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }

    public function trouver(string $roleId): RoleMetier
    {
        $role = RoleMetier::query()->find($roleId);

        if ($role === null) {
            abort(404, 'Rôle introuvable.');
        }

        return $role;
    }

    public function modifier(RoleMetier $role, array $donnees): RoleMetier
    {
        if (array_key_exists('code', $donnees)
            && RoleMetier::query()
                ->where('code', $donnees['code'])
                ->where('id_role', '!=', $role->id_role)
                ->exists()) {
            abort(409, 'Ce code de rôle est déjà utilisé.');
        }

        $role->fill($donnees);
        $role->save();

        return $role;
    }
}