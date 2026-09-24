<?php

namespace App\Services\Acces;

use App\Models\User;

class VerifierDroitService
{
    public function verifier(User $user, string $permissionCode): array
    {
        $roles = $user->rolesMetier()
            ->where('role_metier.actif', true)
            ->whereHas('permissions', function ($query) use ($permissionCode) {
                $query->where('code', $permissionCode)
                    ->where('actif', true);
            })
            ->get();

        return [
            'user_id' => $user->id,
            'permission_code' => $permissionCode,
            'autorise' => $roles->isNotEmpty(),
            'roles_source' => $roles->pluck('id_role')->values()->all(),
        ];
    }
}