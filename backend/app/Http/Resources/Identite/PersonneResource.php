<?php

namespace App\Http\Resources\Identite;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idPersonne' => $this->id_personne,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'dateNaissance' => $this->date_naissance?->format('Y-m-d'),
            'sexe' => $this->sexe,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'photoUrl' => $this->photo_url,
            'statut' => $this->statut,
            'dateCreation' => $this->date_creation?->toIso8601String(),
            'dateModification' => $this->date_modification?->toIso8601String(),
        ];
    }
}