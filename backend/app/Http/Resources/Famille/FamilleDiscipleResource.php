<?php

namespace App\Http\Resources\Famille;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilleDiscipleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idFamilleDisciple' => $this->id_famille_disciple,
            'nom' => $this->nom,
            'periodeDebut' => $this->periode_debut?->toDateString(),
            'periodeFin' => $this->periode_fin?->toDateString(),
            'responsableId' => $this->responsable_id,
            'responsableNom' => $this->when(
                $this->relationLoaded('responsable') && $this->responsable,
                trim(($this->responsable->prenom ?? '').' '.($this->responsable->nom ?? '')),
            ),
            'statut' => $this->statut,
            'nbDepartementsRepresentes' => $this->nb_departements_representes ?? 0,
            'nbDepartementsActifsTotal' => $this->nb_departements_actifs_total ?? 0,
            'statutCompletude' => $this->statut_completude ?? 'INCOMPLET',
            'compositions' => CompositionFamilleDiscipleResource::collection(
                $this->whenLoaded('compositions')
            )->resolve(),
            'modeSimulation' => false,
        ];
    }
}