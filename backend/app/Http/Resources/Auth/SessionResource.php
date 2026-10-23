<?php

namespace App\Http\Resources\Auth;

use App\Http\Resources\Acces\RoleResource;
use App\Http\Resources\Identite\CompteResource;
use App\Http\Resources\Identite\PersonneResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['personne', 'rolesMetier.permissions']);

        $roles = $this->rolesMetier
            ->filter(fn ($role) => (bool) $role->actif)
            ->values();

        $permissions = $roles
            ->flatMap(fn ($role) => $role->permissions)
            ->filter(fn ($permission) => (bool) $permission->actif)
            ->pluck('code')
            ->unique()
            ->values()
            ->all();

        $personne = $this->personnePayload();
        $compte = (new CompteResource($this->resource))->resolve();
        $compte['idCompte'] = (string) ($compte['idCompte'] ?? $this->id);
        $compte['idPersonne'] = $compte['idPersonne'] ?: $personne['idPersonne'];
        $compte['mfaActive'] = (bool) ($compte['mfaActive'] ?? false);
        $compte['statut'] = $compte['statut'] ?: ($this->statut ?: 'actif');
        $compte['dateCreation'] = $compte['dateCreation'] ?? now()->toIso8601String();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'statut' => $this->statut ?: 'actif',
            'permissions' => $permissions,
            'compte' => $compte,
            'personne' => $personne,
            'roles' => RoleResource::collection($roles)->resolve(),
        ];
    }

    private function personnePayload(): array
    {
        if ($this->personne) {
            return (new PersonneResource($this->personne))->resolve();
        }

        $parts = preg_split('/\s+/', trim((string) $this->name), 2) ?: [];
        $now = now()->toIso8601String();

        return [
            'idPersonne' => '',
            'prenom' => $parts[0] ?? (string) $this->name,
            'nom' => $parts[1] ?? '',
            'statut' => 'actif',
            'dateCreation' => $this->created_at?->toIso8601String() ?? $now,
            'dateModification' => $this->updated_at?->toIso8601String() ?? $now,
        ];
    }
}