<?php

namespace App\Http\Resources\Famille;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PresenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $personne = $this->affectation?->membre?->personne;

        return [
            'idPresence' => $this->id_presence,
            'idAffectation' => $this->id_affectation,
            'idPersonne' => $this->affectation?->membre?->id_personne,
            'nom' => $personne?->nom,
            'prenom' => $personne?->prenom,
            'dateReunion' => $this->date_reunion?->toDateString(),
            'present' => (bool) $this->present,
            'commentaire' => $this->commentaire,
        ];
    }
}