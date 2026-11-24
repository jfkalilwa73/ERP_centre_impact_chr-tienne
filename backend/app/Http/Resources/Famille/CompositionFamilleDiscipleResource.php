<?php

namespace App\Http\Resources\Famille;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompositionFamilleDiscipleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $personne = $this->membre?->personne;

        return [
            'idComposition' => $this->id_composition,
            'idMembre' => $this->id_membre,
            'idPersonne' => $personne?->id_personne,
            'numeroMembre' => $this->membre?->numero_membre,
            'prenom' => $personne?->prenom,
            'nom' => $personne?->nom,
            'telephone' => $personne?->telephone,
            'commentaireIntegration' => null,
            'adhesionConfirmee' => true,
            'nouveauVenu' => false,
            'dateAccueil' => $this->date_debut?->toDateString(),
            'departementOrigineId' => $this->departement_origine_id,
            'departementOrigineNom' => $this->departementOrigine?->nom ?? '',
            'actif' => (bool) $this->actif,
        ];
    }
}