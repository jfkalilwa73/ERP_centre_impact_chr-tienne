<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class AuditLogService
{
    public function enregistrer(array $donnees): AuditLog
    {
        $log = new AuditLog();
        $log->id_audit = (string) Str::uuid();
        $log->user_id = $donnees['user_id'] ?? null;
        $log->action = $donnees['action'];
        $log->entite_type = $donnees['entite_type'];
        $log->id_entite = $donnees['id_entite'];
        $log->anciennes_valeurs = $donnees['anciennes_valeurs'] ?? null;
        $log->nouvelles_valeurs = $donnees['nouvelles_valeurs'] ?? null;
        $log->adresse_ip = $donnees['adresse_ip'] ?? null;
        $log->user_agent = $donnees['user_agent'] ?? null;
        $log->save();

        return $log;
    }

    public function lister(): Collection
    {
        return AuditLog::query()
            ->orderByDesc('date_action')
            ->get();
    }
}