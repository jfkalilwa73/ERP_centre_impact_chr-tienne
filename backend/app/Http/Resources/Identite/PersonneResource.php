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
            'postnom' => $this->postnom,
            'dateNaissance' => $this->date_naissance?->format('Y-m-d'),
            'sexe' => $this->sexe,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'photoUrl' => $this->photoUrl(),
            'statut' => $this->statut,
            'dateCreation' => $this->date_creation?->toIso8601String(),
            'dateModification' => $this->date_modification?->toIso8601String(),
        ];
    }

    private function photoUrl(): ?string
    {
        $path = $this->photo_url;
        $prefix = "personnes/{$this->id_personne}/";

        if (! is_string($path) || ! str_starts_with($path, $prefix)) {
            return $path;
        }

        return \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'personnes.photo',
            now()->addDays(7),
            ['personneId' => $this->id_personne],
        );
    }
}