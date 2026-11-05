<?php

namespace App\Services\Identite;

use App\Models\Membre;
use App\Models\Personne;
use Illuminate\Database\QueryException;
use App\Models\HistoriqueStatutMembre;
use Illuminate\Support\Str;

class MembreService
{
    public const STATUTS = ['actif', 'inactif', 'en_attente', 'archive'];

    public function creer(string $personneId, array $donnees): Membre
    {
        if (! Personne::query()->find($personneId)) {
            abort(404, 'Personne introuvable.');
        }

        if (Membre::query()->where('id_personne', $personneId)->exists()) {
            abort(409, 'Cette personne est déjà enregistrée comme membre.');
        }

        try {
            // numero_membre vide : le trigger PostgreSQL génère MEM-AAAA-NNNN.
            $membre = Membre::query()->create([
                'id_membre' => (string) Str::uuid(),
                'id_personne' => $personneId,
                'numero_membre' => '',
                'date_integration' => $donnees['date_integration'],
                'statut_membre' => $donnees['statut_membre'] ?? 'en_attente',
                'famille_impact_id' => $donnees['famille_impact_id'] ?? null,
            ]);
        } catch (QueryException $e) {
            if (($e->errorInfo[0] ?? null) === '23505' || str_contains($e->getMessage(), 'unique')) {
                abort(409, 'Cette personne est déjà enregistrée comme membre.');
            }

            throw $e;
        }

        return $membre->refresh();
    }

    public function pourPersonne(string $personneId): Membre
    {
        if (! Personne::query()->find($personneId)) {
            abort(404, 'Personne introuvable.');
        }

        return Membre::query()->where('id_personne', $personneId)->first()
            ?? abort(404, 'Cette personne n’est pas encore enregistrée comme membre.');
    }

    public function trouver(string $membreId): Membre
    {
        return Membre::query()->find($membreId) ?? abort(404, 'Membre introuvable.');
    }

    public function changerStatut(Membre $membre, string $statut, ?string $motif, ?int $userId): Membre
    {
        if (! in_array($statut, self::STATUTS, true)) {
            abort(422, 'Statut de membre inconnu.');
        }

        if ($membre->statut_membre === $statut) {
            abort(409, 'Le membre a déjà ce statut.');
        }

        $ancien = $membre->statut_membre;
        $membre->statut_membre = $statut;
        $membre->motif_changement_statut = $motif;
        $membre->date_changement_statut = now();
        $membre->save();

        $ligne = HistoriqueStatutMembre::query()
            ->where('id_membre', $membre->id_membre)
            ->orderByDesc('date_changement')
            ->first();

        if ($ligne && $userId) {
            $ligne->change_par = $userId;
            $ligne->save();
        }

        return $membre->refresh();
    }

    public function historique(Membre $membre)
    {
        return HistoriqueStatutMembre::query()
            ->with('changePar')
            ->where('id_membre', $membre->id_membre)
            ->orderByDesc('date_changement')
            ->get();
    }
}