<?php

namespace App\Http\Resources\Identite;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_personne' => $this->personne?->id_personne,
            'name' => $this->name,
            'email' => $this->email,
            'statut' => $this->statut,
            'mfa_active' => $this->mfa_active,
            'derniere_connexion' => $this->derniere_connexion?->toIso8601String(),
            'date_desactivation' => $this->date_desactivation?->toIso8601String(),
        ];
    }
}