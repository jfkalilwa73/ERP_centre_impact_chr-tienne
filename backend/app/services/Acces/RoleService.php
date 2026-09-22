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
}