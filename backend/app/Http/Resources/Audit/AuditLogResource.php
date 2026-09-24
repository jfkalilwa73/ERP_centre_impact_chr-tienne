<?php

namespace App\Http\Resources\Audit;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_audit' => $this->id_audit,
            'user_id' => $this->user_id,
            'action' => $this->action,
            'entite_type' => $this->entite_type,
            'id_entite' => $this->id_entite,
            'anciennes_valeurs' => $this->anciennes_valeurs,
            'nouvelles_valeurs' => $this->nouvelles_valeurs,
            'adresse_ip' => $this->adresse_ip,
            'user_agent' => $this->user_agent,
            'date_action' => $this->date_action?->toIso8601String(),
        ];
    }
}