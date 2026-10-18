<?php

namespace App\Http\Resources\Organisation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idDepartement' => $this->id_departement,
            'code' => $this->code,
            'nom' => $this->nom,
            'mission' => $this->mission,
            'idSite' => $this->id_site,
            'actif' => (bool) $this->actif,
            'dateCreation' => $this->date_creation?->toIso8601String(),
        ];
    }
}