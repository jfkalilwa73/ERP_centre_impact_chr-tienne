<?php

namespace App\Http\Resources\Famille;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RelationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idRelation' => $this->id_relation,
            'idPersonne1' => $this->id_personne_1,
            'idPersonne2' => $this->id_personne_2,
            'prenom1' => $this->personne1?->prenom,
            'nom1' => $this->personne1?->nom,
            'prenom2' => $this->personne2?->prenom,
            'nom2' => $this->personne2?->nom,
            'typeRelation' => $this->type_relation,
            'dateDebut' => $this->date_debut?->toIso8601String(),
            'actif' => (bool) $this->actif,
        ];
    }
}