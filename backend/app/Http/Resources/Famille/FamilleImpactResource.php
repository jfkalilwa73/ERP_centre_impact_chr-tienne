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
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'description' => $this->description,
            'actif' => (bool) $this->actif,
            'responsableId' => $this->responsable_id,
            'adjointId' => $this->adjoint_id,
            'capaciteMax' => $this->capacite_max,
            'jourReunion' => $this->jour_reunion,
            'heureReunion' => $this->heure_reunion ? substr((string) $this->heure_reunion, 0, 5) : null,
            'lieuReunion' => $this->lieu_reunion,
            'dateCreation' => $this->date_creation?->toIso8601String(),
        ];
    }
}
