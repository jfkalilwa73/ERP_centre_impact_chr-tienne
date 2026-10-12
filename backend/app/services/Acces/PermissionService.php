<?php

namespace App\Services\Acces;

use App\Models\PermissionMetier;
use Illuminate\Support\Str;

class PermissionService
{
    public function creer(array $donnees): PermissionMetier
    {
        if (PermissionMetier::query()->where('code', $donnees['code'])->exists()) {
            abort(409, 'Ce code de permission est déjà utilisé.');
        }

        if (PermissionMetier::query()
            ->where('module', $donnees['module'])
            ->where('action', $donnees['action'])
            ->exists()
        ) {
            abort(409, 'Cette permission (module + action) existe déjà.');
        }

        $permission = new PermissionMetier();
        $permission->id_permission = (string) Str::uuid();
        $permission->code = $donnees['code'];
        $permission->module = $donnees['module'];
        $permission->action = $donnees['action'];
        $permission->description = $donnees['description'] ?? null;
        $permission->actif = $donnees['actif'] ?? true;
        $permission->save();

        return $permission;
    }
    public function lister(int $page, int $limit, ?string $recherche, ?string $module)
    {
        $requete = PermissionMetier::query()->orderBy('module')->orderBy('action');

        if ($module) {
            $requete->where('module', $module);
        }

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('code', 'ilike', $terme)
                    ->orWhere('module', 'ilike', $terme)
                    ->orWhere('action', 'ilike', $terme)
                    ->orWhere('description', 'ilike', $terme);
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }
}