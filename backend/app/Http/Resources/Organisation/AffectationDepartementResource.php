<?php

namespace App\Http\Resources\Organisation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AffectationDepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_personne' => $this->id_personne,
            'id_departement' => $this->id_departement,
            'fonction' => $this->fonction,
            'date_debut' => $this->date_debut?->toIso8601String(),
            'date_fin' => $this->date_fin?->toIso8601String(),
            'actif' => $this->actif,
        ];
    }
}