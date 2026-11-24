<?php

namespace App\Services\Famille;

use App\Models\AffecterDepartement;
use App\Models\CompositionFamilleDisciple;
use App\Models\Departement;
use App\Models\FamilleDisciple;
use App\Models\Membre;
use App\Models\Personne;
use Illuminate\Support\Str;

class FamilleDiscipleService
{
    public function lister(int $page, int $limit)
    {
        $resultat = FamilleDisciple::query()
            ->with(['responsable', 'compositions' => fn ($q) => $q->where('actif', true)->with(['membre.personne', 'departementOrigine'])])
            ->orderBy('nom')
            ->paginate($limit, ['*'], 'page', $page);

        $totalDep = Departement::query()->where('actif', true)->count();

        $resultat->getCollection()->transform(function (FamilleDisciple $famille) use ($totalDep) {
            return $this->enrichir($famille, $totalDep);
        });

        return $resultat;
    }

    public function trouver(string $id): FamilleDisciple
    {
        $famille = FamilleDisciple::query()
            ->with(['responsable', 'compositions' => fn ($q) => $q->where('actif', true)->with(['membre.personne', 'departementOrigine'])])
            ->find($id);

        if (! $famille) {
            abort(404, 'Famille des Disciples introuvable.');
        }

        return $this->enrichir($famille);
    }

    public function creer(array $donnees): FamilleDisciple
    {
        if (! empty($donnees['responsable_id']) && ! Personne::query()->whereKey($donnees['responsable_id'])->exists()) {
            abort(404, 'Responsable introuvable.');
        }

        $famille = FamilleDisciple::query()->create([
            'id_famille_disciple' => (string) Str::uuid(),
            'nom' => $donnees['nom'],
            'periode_debut' => $donnees['periode_debut'],
            'periode_fin' => $donnees['periode_fin'] ?? null,
            'responsable_id' => $donnees['responsable_id'] ?? null,
            'statut' => $donnees['statut'] ?? 'actif',
        ]);

        return $this->trouver($famille->id_famille_disciple);
    }

    public function admettre(string $familleId, array $donnees): CompositionFamilleDisciple
    {
        $famille = $this->trouver($familleId);

        $membre = Membre::query()->where('id_personne', $donnees['id_personne'])->first();
        if (! $membre) {
            abort(409, 'Cette personne n’a pas encore de dossier membre. Enregistrez-la d’abord comme membre.');
        }

        $deja = CompositionFamilleDisciple::query()
            ->where('id_famille_disciple', $famille->id_famille_disciple)
            ->where('id_membre', $membre->id_membre)
            ->where('actif', true)
            ->exists();
        if ($deja) {
            abort(409, 'Ce membre est déjà dans cette Famille des Disciples.');
        }

        $departementId = $donnees['departement_origine_id']
            ?? AffecterDepartement::query()
                ->where('id_personne', $donnees['id_personne'])
                ->where('actif', true)
                ->value('id_departement');

        if (! $departementId) {
            abort(409, 'Impossible d’admettre ce membre : aucun département d’origine. Affectez d’abord la personne à un département.');
        }

        if (! Departement::query()->whereKey($departementId)->exists()) {
            abort(404, 'Département d’origine introuvable.');
        }

        $inactive = CompositionFamilleDisciple::query()
            ->where('id_famille_disciple', $famille->id_famille_disciple)
            ->where('id_membre', $membre->id_membre)
            ->where('actif', false)
            ->first();

        if ($inactive) {
            $inactive->actif = true;
            $inactive->date_fin = null;
            $inactive->date_debut = $donnees['date_accueil'] ?? now();
            $inactive->departement_origine_id = $departementId;
            $inactive->save();
            $composition = $inactive;
        } else {
            $composition = CompositionFamilleDisciple::query()->create([
                'id_composition' => (string) Str::uuid(),
                'id_famille_disciple' => $famille->id_famille_disciple,
                'id_membre' => $membre->id_membre,
                'departement_origine_id' => $departementId,
                'date_debut' => $donnees['date_accueil'] ?? now(),
                'actif' => true,
            ]);
        }

        return $composition->load(['membre.personne', 'departementOrigine']);
    }

    public function modifierComposition(string $familleId, string $compositionId, array $donnees): CompositionFamilleDisciple
    {
        $composition = $this->composition($familleId, $compositionId);

        if (array_key_exists('actif', $donnees)) {
            $composition->actif = (bool) $donnees['actif'];
            $composition->date_fin = $composition->actif ? null : now();
        }

        $composition->save();

        return $composition->load(['membre.personne', 'departementOrigine']);
    }

    public function retirerComposition(string $familleId, string $compositionId): void
    {
        $composition = $this->composition($familleId, $compositionId);
        $composition->actif = false;
        $composition->date_fin = now();
        $composition->save();
    }

    public function pourPersonne(string $personneId): ?array
    {
        if (! Personne::query()->whereKey($personneId)->exists()) {
            abort(404, 'Personne introuvable.');
        }

        $membre = Membre::query()->where('id_personne', $personneId)->first();
        if (! $membre) {
            return null;
        }

        $composition = CompositionFamilleDisciple::query()
            ->with('familleDisciple')
            ->where('id_membre', $membre->id_membre)
            ->where('actif', true)
            ->orderByDesc('date_debut')
            ->first();

        if (! $composition || ! $composition->familleDisciple) {
            return null;
        }

        return [
            'idFamilleDisciple' => $composition->id_famille_disciple,
            'nomFamilleDisciple' => $composition->familleDisciple->nom,
            'dateAccueil' => $composition->date_debut?->toDateString(),
            'nouveauVenu' => false,
            'statut' => $composition->familleDisciple->statut,
            'modeSimulation' => false,
        ];
    }

    private function composition(string $familleId, string $compositionId): CompositionFamilleDisciple
    {
        $this->trouver($familleId);

        $composition = CompositionFamilleDisciple::query()
            ->where('id_famille_disciple', $familleId)
            ->where('id_composition', $compositionId)
            ->first();

        if (! $composition) {
            abort(404, 'Composition introuvable dans cette famille.');
        }

        return $composition;
    }

    private function enrichir(FamilleDisciple $famille, ?int $totalDep = null): FamilleDisciple
    {
        $totalDep ??= Departement::query()->where('actif', true)->count();
        $nb = $famille->compositions
            ? $famille->compositions->where('actif', true)->pluck('departement_origine_id')->unique()->count()
            : CompositionFamilleDisciple::query()
                ->where('id_famille_disciple', $famille->id_famille_disciple)
                ->where('actif', true)
                ->distinct('departement_origine_id')
                ->count('departement_origine_id');

        $famille->nb_departements_representes = $nb;
        $famille->nb_departements_actifs_total = $totalDep;
        $famille->statut_completude = ($totalDep > 0 && $nb >= $totalDep) ? 'COMPLET' : 'INCOMPLET';

        return $famille;
    }
}