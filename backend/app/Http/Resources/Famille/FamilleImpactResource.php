<?php

namespace App\Http\Resources\Famille;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilleImpactResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idFamille' => $this->id_famille,
            'code' => $this->code,
            'nom' => $this->nom,
            'zone' => $this->zone,
            'description' => $this->description,
            'actif' => (bool) $this->actif,
            'dateCreation' => $this->date_creation?->toIso8601String(),
        ];
    }
}
