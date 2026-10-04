<?php

namespace App\Http\Resources\Identite;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('personne');

        return [
            'idCompte' => (string) $this->id,
            'idPersonne' => $this->personne?->id_personne,
            'email' => $this->email,
            'statut' => $this->statut,
            'derniereConnexion' => $this->derniere_connexion?->toIso8601String(),
            'mfaActive' => (bool) $this->mfa_active,
            'dateCreation' => $this->created_at?->toIso8601String(),
            'dateDesactivation' => $this->date_desactivation?->toIso8601String(),
        ];
    }
}