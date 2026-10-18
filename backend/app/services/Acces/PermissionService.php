<?php

namespace App\Services\Acces;

use App\Models\PermissionMetier;
use Illuminate\Support\Str;
use App\Models\AffecterRoleMetier;
use App\Models\User;

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
    public function listerTitulaires(string $permissionId): array
    {
        $permission = PermissionMetier::query()->find($permissionId);

        if ($permission === null) {
            abort(404, 'Permission introuvable.');
        }

        $rolesQuiDonnent = $permission->roles()->pluck('role_metier.id_role');

        $userIds = AffecterRoleMetier::query()
            ->where('actif', true)
            ->whereIn('id_role', $rolesQuiDonnent)
            ->pluck('user_id')
            ->unique()
            ->values();

        $comptes = User::query()
            ->with('personne')
            ->whereIn('id', $userIds)
            ->get();

        $affectations = AffecterRoleMetier::query()
            ->where('actif', true)
            ->whereIn('user_id', $userIds)
            ->get()
            ->groupBy('user_id');

        return $comptes->map(function (User $compte) use ($affectations) {
            $personne = $compte->personne;

            return [
                'idCompte' => (string) $compte->id,
                'email' => $compte->email,
                'statut' => $compte->statut,
                'idPersonne' => $personne?->id_personne,
                'nom' => $personne?->nom ?? '',
                'prenom' => $personne?->prenom ?? '',
                'idRoles' => ($affectations->get($compte->id) ?? collect())
                    ->pluck('id_role')
                    ->values()
                    ->all(),
            ];
        })->values()->all();
    }

    public function modifier(PermissionMetier $permission, array $donnees): PermissionMetier
    {
        if (array_key_exists('code', $donnees)
            && PermissionMetier::query()
                ->where('code', $donnees['code'])
                ->where('id_permission', '!=', $permission->id_permission)
                ->exists()) {
            abort(409, 'Ce code de permission est déjà utilisé.');
        }

        $module = $donnees['module'] ?? $permission->module;
        $action = $donnees['action'] ?? $permission->action;

        if ((array_key_exists('module', $donnees) || array_key_exists('action', $donnees))
            && PermissionMetier::query()
                ->where('module', $module)
                ->where('action', $action)
                ->where('id_permission', '!=', $permission->id_permission)
                ->exists()) {
            abort(409, 'Cette permission (module + action) existe déjà.');
        }

        $permission->fill($donnees);
        $permission->save();

        return $permission;
    }

    public function supprimer(PermissionMetier $permission): void
    {
        if ($permission->roles()->exists()) {
            abort(409, 'Ce droit est encore utilisé par un rôle.');
        }

        $permission->delete();
    }
}