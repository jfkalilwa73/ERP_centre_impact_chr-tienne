<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('rolesMetier.permissions');

        $permissions = $this->rolesMetier
            ->flatMap(fn ($role) => $role->permissions)
            ->where('actif', true)
            ->pluck('code')
            ->unique()
            ->values()
            ->all();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'statut' => $this->statut,
            'permissions' => $permissions,
        ];
    }
}