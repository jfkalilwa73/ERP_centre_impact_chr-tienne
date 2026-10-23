<?php

namespace App\Services\Famille;

use App\Models\AppartenirFamille;
use App\Models\FamilleImpact;
use App\Models\Personne;
use App\Services\Sprint1\SuiviMembreService;
use Illuminate\Support\Facades\DB;

class AffectationFamilleService
{
    public function lister(string $personneId, ?string $actif)
    {
        if (! Personne::query()->whereKey($personneId)->exists()) abort(404, 'Personne introuvable.');
        $query = AppartenirFamille::query()->where('id_personne', $personneId)->orderByDesc('date_debut');
        if ($actif !== null && $actif !== '') $query->where('actif', filter_var($actif, FILTER_VALIDATE_BOOLEAN));
        return $query->get();
    }

    public function affecter(string $personneId, array $data): AppartenirFamille
    {
        $personne = Personne::query()->find($personneId);
        if (! $personne) abort(404, 'Personne introuvable.');
        $famille = FamilleImpact::query()->find($data['id_famille']);
        if (! $famille) abort(404, 'Famille d’impact introuvable.');
        if (! $famille->actif) abort(409, 'Cette famille est inactive.');
        if (AppartenirFamille::query()->where('id_personne', $personneId)->where('actif', true)->exists()) {
            abort(409, 'Cette personne appartient déjà à une famille active.');
        }

        return DB::transaction(function () use ($personneId, $famille, $data) {
            $affectation = AppartenirFamille::query()->create([
                'id_personne' => $personneId,
                'id_famille' => $famille->id_famille,
                'fonction' => $data['fonction'] ?? null,
                'date_debut' => $data['date_debut'] ?? now(),
                'date_fin' => $data['date_fin'] ?? null,
                'actif' => true,
            ]);
            app(SuiviMembreService::class)->ouvrir($personneId, $famille->id_famille, $affectation->date_debut);

            return $affectation;
        });
    }

    public function cloturer(string $personneId, string $familleId): void
    {
        $affectation = AppartenirFamille::query()->where('id_personne', $personneId)->where('id_famille', $familleId)
            ->where('actif', true)->orderByDesc('date_debut')->first();
        if (! $affectation) abort(404, 'Appartenance active introuvable.');
        DB::transaction(function () use ($personneId, $familleId, $affectation) {
            AppartenirFamille::query()->where('id_personne', $personneId)->where('id_famille', $familleId)
                ->where('date_debut', $affectation->date_debut)->update(['actif' => false, 'date_fin' => now()]);
            app(SuiviMembreService::class)->cloturer($personneId, $familleId);
        });
    }
}
