<?php

namespace App\Services\Famille;

use App\Models\AffecterFamilleImpact;
use App\Models\AppartenirFamille;
use App\Models\FamilleImpact;
use App\Models\Membre;
use App\Models\PresenceFamilleImpact;
use App\Services\Identite\MembreService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SuiviMembreService
{
    public function synchroniserFamille(string $familleId)
    {
        $this->famille($familleId);
        $appartenances = AppartenirFamille::query()
            ->where('id_famille', $familleId)
            ->where('actif', true)
            ->get();

        foreach ($appartenances as $appartenance) {
            $this->ouvrir($appartenance->id_personne, $familleId, $appartenance->date_debut);
        }

        return $this->affectationsActives($familleId);
    }

    public function ouvrir(string $personneId, string $familleId, mixed $dateDebut = null): AffecterFamilleImpact
    {
        $this->famille($familleId);
        $membre = Membre::query()->where('id_personne', $personneId)->first();
        if (! $membre) {
            $membre = app(MembreService::class)->creer($personneId, [
                'date_integration' => $dateDebut ? Carbon::parse($dateDebut)->toDateString() : now()->toDateString(),
                'statut_membre' => 'actif',
                'famille_impact_id' => $familleId,
            ]);
        } else {
            $membre->famille_impact_id = $familleId;
            $membre->save();
        }

        AffecterFamilleImpact::query()
            ->where('id_membre', $membre->id_membre)
            ->where('actif', true)
            ->where('id_famille_impact', '!=', $familleId)
            ->update([
                'actif' => false,
                'date_fin' => now(),
                'motif_fin' => 'Changement de famille d’impact',
            ]);

        $existante = AffecterFamilleImpact::query()
            ->where('id_membre', $membre->id_membre)
            ->where('id_famille_impact', $familleId)
            ->where('actif', true)
            ->first();
        if ($existante) {
            return $existante->load('membre.personne');
        }

        return AffecterFamilleImpact::query()->create([
            'id_affectation' => (string) Str::uuid(),
            'id_membre' => $membre->id_membre,
            'id_famille_impact' => $familleId,
            'date_debut' => $dateDebut ?? now(),
            'actif' => true,
        ])->load('membre.personne');
    }

    public function affectationsActives(string $familleId)
    {
        return AffecterFamilleImpact::query()
            ->with('membre.personne')
            ->where('id_famille_impact', $familleId)
            ->where('actif', true)
            ->orderBy('date_debut')
            ->get();
    }

    public function presences(string $familleId)
    {
        $this->famille($familleId);
        $affectations = $this->affectationsActives($familleId);
        $ids = $affectations->pluck('id_affectation');

        $presences = PresenceFamilleImpact::query()
            ->with('affectation.membre.personne')
            ->whereIn('id_affectation', $ids)
            ->orderByDesc('date_reunion')
            ->get();

        return ['affectations' => $affectations, 'presences' => $presences];
    }

    public function enregistrerPresences(string $familleId, string $dateReunion, array $lignes, ?int $userId)
    {
        $affectations = $this->affectationsActives($familleId)->keyBy('id_affectation');
        if ($affectations->isEmpty()) {
            abort(409, 'Aucun membre suivi dans cette famille d’impact.');
        }

        foreach ($lignes as $ligne) {
            $affectation = $affectations->get($ligne['id_affectation']);
            if (! $affectation) {
                abort(422, 'Une ligne ne correspond pas à un membre de cette famille.');
            }

            $presence = PresenceFamilleImpact::query()
                ->where('id_affectation', $affectation->id_affectation)
                ->whereDate('date_reunion', $dateReunion)
                ->first();

            $valeurs = [
                'present' => (bool) $ligne['present'],
                'commentaire' => $ligne['commentaire'] ?? null,
                'enregistre_par' => $userId,
            ];

            if ($presence) {
                $presence->fill($valeurs);
                $presence->save();
                continue;
            }

            PresenceFamilleImpact::query()->create([
                'id_presence' => (string) Str::uuid(),
                'id_affectation' => $affectation->id_affectation,
                'date_reunion' => $dateReunion,
                ...$valeurs,
            ]);
        }

        return $this->presences($familleId);
    }

    private function famille(string $familleId): FamilleImpact
    {
        return FamilleImpact::query()->find($familleId) ?? abort(404, 'Famille d’impact introuvable.');
    }
}