<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AffectationRoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idCompte' => (string) $this->user_id,
            'idRole' => $this->id_role,
            'dateDebut' => $this->date_debut?->toIso8601String(),
            'dateFin' => $this->date_fin?->toIso8601String(),
            'actif' => (bool) $this->actif,
        ];
    }
}