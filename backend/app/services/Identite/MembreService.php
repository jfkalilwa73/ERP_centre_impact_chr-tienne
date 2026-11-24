<?php

namespace App\Services\Identite;

use App\Models\Membre;
use App\Models\Personne;
use Illuminate\Database\QueryException;
use App\Models\HistoriqueStatutMembre;
use App\Models\AffecterFamilleImpact;
use App\Models\CompositionFamilleDisciple;
use Illuminate\Support\Facades\DB;
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

        $valeurs = [
            'id_membre' => (string) Str::uuid(),
            'id_personne' => $personneId,
            'numero_membre' => '',
            'date_integration' => $donnees['date_integration'],
            'statut_membre' => $donnees['statut_membre'] ?? 'en_attente',
        ];

        if (! empty($donnees['famille_impact_id'])) {
            $valeurs['famille_impact_id'] = $donnees['famille_impact_id'];
        }

        try {
            // numero_membre vide : le trigger PostgreSQL génère MEM-AAAA-NNNN.
            $membre = Membre::query()->create($valeurs);
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


    public function modifier(Membre $membre, array $donnees): Membre
    {
        $membre->date_integration = $donnees['date_integration'];
        $membre->save();

        return $membre->refresh();
    }

    public function supprimer(Membre $membre): void
    {
        if ($membre->statut_membre === 'actif') {
            abort(409, 'Impossible de supprimer un membre actif. Passer le statut à inactif ou archive d’abord.');
        }

        if (AffecterFamilleImpact::query()->where('id_membre', $membre->id_membre)->exists()) {
            abort(409, 'Impossible de supprimer un membre encore lié à une famille d’impact.');
        }

        try {
            DB::transaction(function () use ($membre) {
                HistoriqueStatutMembre::query()
                    ->where('id_membre', $membre->id_membre)
                    ->delete();

                $membre->delete();
            });
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Impossible de supprimer un membre actif')) {
                abort(409, 'Impossible de supprimer un membre actif. Passer le statut à inactif ou archive d’abord.');
            }

            throw $e;
        }
    }


    public function fusionner(Membre $cible, string $sourceId): Membre
    {
        $source = $this->trouver($sourceId);

        if ($cible->id_membre === $source->id_membre) {
            abort(422, 'Impossible de fusionner un membre avec lui-même.');
        }

        return DB::transaction(function () use ($cible, $source) {
            $cibleAUneAffectationActive = AffecterFamilleImpact::query()
                ->where('id_membre', $cible->id_membre)
                ->where('actif', true)
                ->exists();

            $affectations = AffecterFamilleImpact::query()
                ->where('id_membre', $source->id_membre)
                ->get();

            foreach ($affectations as $affectation) {
                if ($affectation->actif && $cibleAUneAffectationActive) {
                    $affectation->actif = false;
                    $affectation->date_fin = now();
                    $affectation->motif_fin = 'Fusion de doublon';
                }
                $affectation->id_membre = $cible->id_membre;
                $affectation->save();

                if ($affectation->actif) {
                    $cibleAUneAffectationActive = true;
                }
            }

            HistoriqueStatutMembre::query()
                ->where('id_membre', $source->id_membre)
                ->update(['id_membre' => $cible->id_membre]);

            $compositions = CompositionFamilleDisciple::query()
                ->where('id_membre', $source->id_membre)
                ->get();

            foreach ($compositions as $composition) {
                $deja = CompositionFamilleDisciple::query()
                    ->where('id_famille_disciple', $composition->id_famille_disciple)
                    ->where('id_membre', $cible->id_membre)
                    ->exists();

                if ($deja) {
                    $composition->actif = false;
                    $composition->date_fin = now();
                    $composition->save();
                    $composition->delete();
                } else {
                    $composition->id_membre = $cible->id_membre;
                    $composition->save();
                }
            }

            $dateCible = $cible->date_integration?->toDateString();
            $dateSource = $source->date_integration?->toDateString();
            if ($dateSource && (! $dateCible || $dateSource < $dateCible)) {
                $cible->date_integration = $source->date_integration;
                $cible->save();
            }

            // Le trigger interdit la suppression d'un membre actif.
            if ($source->statut_membre === 'actif') {
                $source->statut_membre = 'archive';
                $source->motif_changement_statut = 'Fusion de doublon';
                $source->date_changement_statut = now();
                $source->save();
            }

            HistoriqueStatutMembre::query()
                ->where('id_membre', $source->id_membre)
                ->delete();

            $source->delete();

            return $cible->refresh()->load('personne');
        });
    }

    public function lister(int $page, int $limit, ?string $recherche, ?string $statut)
    {
        $requete = Membre::query()
            ->with('personne')
            ->orderByDesc('date_integration')
            ->orderBy('numero_membre');

        if ($statut) {
            if (! in_array($statut, self::STATUTS, true)) {
                abort(422, 'Statut de membre inconnu.');
            }
            $requete->where('statut_membre', $statut);
        }

        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $requete->where(function ($q) use ($terme) {
                $q->where('numero_membre', 'ilike', $terme)
                    ->orWhereHas('personne', function ($personne) use ($terme) {
                        $personne->where('nom', 'ilike', $terme)
                            ->orWhere('prenom', 'ilike', $terme);
                    });
            });
        }

        return $requete->paginate($limit, ['*'], 'page', $page);
    }
}