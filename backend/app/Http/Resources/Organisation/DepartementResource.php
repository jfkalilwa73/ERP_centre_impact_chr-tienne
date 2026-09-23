<?php

namespace App\Http\Resources\Organisation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_departement' => $this->id_departement,
            'code' => $this->code,
            'nom' => $this->nom,
            'mission' => $this->mission,
            'id_site' => $this->id_site,
            'actif' => $this->actif,
            'date_creation' => $this->date_creation?->toIso8601String(),
        ];
    }
}