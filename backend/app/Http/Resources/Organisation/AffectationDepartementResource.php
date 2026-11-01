<?php

namespace App\Http\Resources\Organisation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AffectationDepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idPersonne' => $this->id_personne,
            'idDepartement' => $this->id_departement,
            'fonction' => $this->fonction,
            'dateDebut' => $this->date_debut?->toIso8601String(),
            'dateFin' => $this->date_fin?->toIso8601String(),
            'actif' => (bool) $this->actif,
        ];
    }
}