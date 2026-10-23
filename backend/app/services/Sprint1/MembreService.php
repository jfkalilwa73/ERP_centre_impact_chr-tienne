<?php

namespace App\Services\Sprint1;

use App\Models\HistoriqueStatutMembre;
use App\Models\Membre;
use App\Models\Personne;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class MembreService
{
    public const STATUTS = ['actif', 'inactif', 'en_attente', 'archive'];

    public function pourPersonne(string $personneId): Membre
    {
        if (! Personne::query()->whereKey($personneId)->exists()) {
            abort(404, 'Personne introuvable.');
        }

        return Membre::query()->where('id_personne', $personneId)->first()
            ?? abort(404, 'Cette personne n’est pas encore enregistrée comme membre.');
    }

    public function trouver(string $membreId): Membre
    {
        return Membre::query()->find($membreId) ?? abort(404, 'Membre introuvable.');
    }

    public function lister(int $page, int $limit, ?string $recherche, ?string $statut)
    {
        $query = Membre::query()->with('personne')->orderByDesc('date_integration');
        if ($statut) {
            $query->where('statut_membre', $statut);
        }
        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $query->where(function ($builder) use ($terme) {
                $builder->where('numero_membre', 'ilike', $terme)
                    ->orWhereHas('personne', function ($personnes) use ($terme) {
                        $personnes->where('nom', 'ilike', $terme)->orWhere('prenom', 'ilike', $terme);
                    });
            });
        }

        return $query->paginate($limit, ['*'], 'page', $page);
    }

    public function creer(string $personneId, array $donnees): Membre
    {
        $personne = Personne::query()->find($personneId);
        if (! $personne) {
            abort(404, 'Personne introuvable.');
        }
        if (Membre::query()->where('id_personne', $personneId)->exists()) {
            abort(409, 'Cette personne est déjà enregistrée comme membre.');
        }

        try {
            $membre = Membre::query()->create([
                'id_membre' => (string) Str::uuid(),
                'id_personne' => $personneId,
                'numero_membre' => '',
                'date_integration' => $donnees['date_integration'],
                'statut_membre' => $donnees['statut_membre'] ?? 'en_attente',
                'famille_impact_id' => $donnees['famille_impact_id'] ?? null,
            ]);
        } catch (QueryException) {
            abort(409, 'Cette personne est déjà enregistrée comme membre.');
        }

        return $membre->refresh();
    }

    public function changerStatut(Membre $membre, string $statut, ?string $motif, ?int $userId): Membre
    {
        if (! in_array($statut, self::STATUTS, true)) {
            abort(422, 'Statut de membre inconnu.');
        }
        if ($membre->statut_membre === $statut) {
            abort(409, 'Le membre a déjà ce statut.');
        }

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
