<?php

namespace App\Http\Resources\Identite;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistoriqueStatutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idHistorique' => $this->id_historique,
            'idMembre' => $this->id_membre,
            'ancienStatut' => $this->ancien_statut,
            'nouveauStatut' => $this->nouveau_statut,
            'motif' => $this->motif,
            'changePar' => $this->changePar?->name,
            'dateChangement' => $this->date_changement?->toIso8601String(),
        ];
    }
}