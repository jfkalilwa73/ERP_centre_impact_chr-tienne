<?php

namespace App\Services\Organisation;

use App\Models\AffecterDepartement;
use App\Models\Departement;
use App\Models\Personne;

class AffectationDepartementService
{
    public function affecter(Personne $personne, array $donnees): AffecterDepartement
    {
        $departement = Departement::query()->find($donnees['id_departement']);

        if (! $departement) {
            abort(404, 'Département introuvable.');
        }

        $dejaActif = AffecterDepartement::query()
            ->where('id_personne', $personne->id_personne)
            ->where('id_departement', $departement->id_departement)
            ->where('actif', true)
            ->exists();

        if ($dejaActif) {
            abort(409, 'Cette personne est déjà affectée à ce département.');
        }

        return AffecterDepartement::create([
            'id_personne' => $personne->id_personne,
            'id_departement' => $departement->id_departement,
            'fonction' => $donnees['fonction'] ?? null,
            'date_debut' => $donnees['date_debut'] ?? now(),
            'date_fin' => $donnees['date_fin'] ?? null,
            'actif' => true,
        ]);
    }

    public function lister(string $personneId, ?string $actif)
    {
        $personne = Personne::query()->find($personneId);

        if ($personne === null) {
            abort(404, 'Personne introuvable.');
        }

        $requete = AffecterDepartement::query()
            ->where('id_personne', $personne->id_personne)
            ->orderByDesc('date_debut');

        if ($actif !== null && $actif !== '') {
            $requete->where('actif', filter_var($actif, FILTER_VALIDATE_BOOLEAN));
        }

        return $requete->get();
    }
}