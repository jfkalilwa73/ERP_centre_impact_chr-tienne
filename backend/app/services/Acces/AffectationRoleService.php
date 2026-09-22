<?php

namespace App\Services\Acces;

use App\Models\AffecterRoleMetier;
use App\Models\RoleMetier;
use App\Models\User;

class AffectationRoleService
{
    public function attribuer(User $user, array $donnees): AffecterRoleMetier
    {
        $role = RoleMetier::query()->find($donnees['id_role']);

        if (! $role) {
            abort(404, 'Rôle introuvable.');
        }

        $dejaActif = AffecterRoleMetier::query()
            ->where('user_id', $user->id)
            ->where('id_role', $role->id_role)
            ->where('actif', true)
            ->exists();

        if ($dejaActif) {
            abort(409, 'Ce rôle est déjà attribué à ce compte.');
        }

        return AffecterRoleMetier::create([
            'user_id' => $user->id,
            'id_role' => $role->id_role,
            'date_debut' => $donnees['date_debut'] ?? now(),
            'date_fin' => $donnees['date_fin'] ?? null,
            'actif' => true,
        ]);
    }
}