<?php

namespace App\Http\Resources\Sprint1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AffectationMembreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $personne = $this->membre?->personne;

        return [
            'idAffectation' => $this->id_affectation,
            'idMembre' => $this->id_membre,
            'idPersonne' => $this->membre?->id_personne,
            'numeroMembre' => $this->membre?->numero_membre,
            'nom' => $personne?->nom,
            'prenom' => $personne?->prenom,
            'dateDebut' => $this->date_debut?->toIso8601String(),
            'actif' => (bool) $this->actif,
        ];
    }
}
