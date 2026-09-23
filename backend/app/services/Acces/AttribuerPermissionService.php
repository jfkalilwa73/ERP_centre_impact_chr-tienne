<?php

namespace App\Services\Acces;

use App\Models\AttribuerPermission;
use App\Models\PermissionMetier;
use App\Models\RoleMetier;

class AttribuerPermissionService
{
    public function attribuer(RoleMetier $role, array $donnees): AttribuerPermission
    {
        $permission = PermissionMetier::query()->find($donnees['id_permission']);

        if (! $permission) {
            abort(404, 'Permission introuvable.');
        }

        $dejaLiee = AttribuerPermission::query()
            ->where('id_role', $role->id_role)
            ->where('id_permission', $permission->id_permission)
            ->exists();

        if ($dejaLiee) {
            abort(409, 'Cette permission est déjà attribuée à ce rôle.');
        }

        return AttribuerPermission::create([
            'id_role' => $role->id_role,
            'id_permission' => $permission->id_permission,
        ]);
    }
}