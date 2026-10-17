<?php

namespace App\Http\Resources\Audit;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idAudit' => $this->id_audit,
            'idCompte' => $this->user_id !== null ? (string) $this->user_id : null,
            'action' => $this->action,
            'entiteType' => $this->entite_type,
            'idEntite' => $this->id_entite,
            'anciennesValeurs' => $this->anciennes_valeurs,
            'nouvellesValeurs' => $this->nouvelles_valeurs,
            'adresseIp' => $this->adresse_ip,
            'userAgent' => $this->user_agent,
            'dateAction' => $this->date_action?->toIso8601String(),
        ];
    }
}