<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
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

    public function lister(
        int $page,
        int $limit,
        ?string $action,
        ?string $entiteType,
        ?string $compteId = null,
        ?string $entiteId = null,
        ?string $depuis = null,
        ?string $jusqua = null,
    )
    {
        $requete = AuditLog::query()->orderByDesc('date_action');

        if ($action) {
            $requete->where('action', 'ilike', '%'.$action.'%');
        }

        if ($entiteType) {
            $requete->where('entite_type', $entiteType);
        }

        if ($compteId) $requete->where('user_id', $compteId);
        if ($entiteId) $requete->where('id_entite', $entiteId);
        if ($depuis) $requete->where('date_action', '>=', $depuis);
        if ($jusqua) $requete->where('date_action', '<=', $jusqua);

        return $requete->paginate($limit, ['*'], 'page', $page);
    }

    public function trouver(string $auditId): AuditLog
    {
        return AuditLog::query()->find($auditId) ?? abort(404, 'Trace d’audit introuvable.');
    }
}
