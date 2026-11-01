<?php

namespace App\Http\Resources\Famille;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AffectationFamilleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idPersonne' => $this->id_personne,
            'idFamille' => $this->id_famille,
            'fonction' => $this->fonction,
            'dateDebut' => $this->date_debut?->toIso8601String(),
            'dateFin' => $this->date_fin?->toIso8601String(),
            'actif' => (bool) $this->actif,
        ];
    }
}
