<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idRole' => $this->id_role,
            'code' => $this->code,
            'nom' => $this->nom,
            'description' => $this->description,
            'niveauConfidentialite' => $this->niveau_confidentialite,
            'actif' => (bool) $this->actif,
            'dateCreation' => $this->date_creation?->toIso8601String(),
        ];
    }
}