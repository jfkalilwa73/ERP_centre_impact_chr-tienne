<?php

namespace App\Http\Resources\Acces;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_role' => $this->id_role,
            'code' => $this->code,
            'nom' => $this->nom,
            'description' => $this->description,
            'niveau_confidentialite' => $this->niveau_confidentialite,
            'actif' => $this->actif,
            'date_creation' => $this->date_creation?->toIso8601String(),
        ];
    }
}