<?php

namespace App\Http\Resources\Sprint1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegroupementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idFamille' => $this->id_famille,
            'nomFamille' => $this->nom_famille,
            'adresse' => $this->adresse,
            'telephonePrincipal' => $this->telephone_principal,
            'responsableLegalId' => $this->responsable_legal_id,
            'relations' => RelationResource::collection($this->whenLoaded('relations'))->resolve(),
        ];
    }
}
