<?php

namespace App\Http\Resources\Identite;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MembreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idMembre' => $this->id_membre,
            'idPersonne' => $this->id_personne,
            'numeroMembre' => $this->numero_membre,
            'dateIntegration' => $this->date_integration?->toDateString(),
            'statutMembre' => $this->statut_membre,
            'dateChangementStatut' => $this->date_changement_statut?->toIso8601String(),
            'motifChangementStatut' => $this->motif_changement_statut,
            'familleImpactId' => $this->famille_impact_id,
            'nom' => $this->personne?->nom,
            'prenom' => $this->personne?->prenom,
        ];
    }
}