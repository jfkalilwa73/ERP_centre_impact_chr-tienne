<?php

namespace App\Http\Resources\Identite;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_personne' => $this->id_personne,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'date_naissance' => $this->date_naissance?->format('Y-m-d'),
            'sexe' => $this->sexe,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'photo_url' => $this->photo_url,
            'statut' => $this->statut,
            'user_id' => $this->user_id,
        ];
    }
}