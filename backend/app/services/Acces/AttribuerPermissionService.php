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
    public function lister(string $roleId)
    {
        $role = RoleMetier::query()->find($roleId);

        if ($role === null) {
            abort(404, 'Rôle introuvable.');
        }

        return $role->permissions()->orderBy('module')->orderBy('action')->get();
    }

    public function retirer(string $roleId, string $permissionId): void
    {
        $role = RoleMetier::query()->find($roleId);
        if ($role === null) abort(404, 'Rôle introuvable.');
        $deleted = AttribuerPermission::query()->where('id_role', $roleId)->where('id_permission', $permissionId)->delete();
        if (! $deleted) abort(404, 'Permission non attribuée à ce rôle.');
    }
}
