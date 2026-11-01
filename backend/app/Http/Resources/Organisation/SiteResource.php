<?php

namespace App\Http\Resources\Organisation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idSite' => $this->id_site,
            'code' => $this->code,
            'nom' => $this->nom,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'pays' => $this->pays,
            'telephone' => $this->telephone,
            'actif' => (bool) $this->actif,
            'dateCreation' => $this->date_creation?->toIso8601String(),
        ];
    }
}