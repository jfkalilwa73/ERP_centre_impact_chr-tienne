<?php

namespace App\Services\Sprint1;

use App\Models\Famille;
use App\Models\Personne;
use App\Models\RelationFamiliale;
use Illuminate\Support\Str;

class RegroupementService
{
    public const TYPES = ['conjoint', 'parent', 'enfant', 'tuteur', 'frere_soeur', 'autre'];

    public function pourPersonne(string $personneId): Famille
    {
        if (! Personne::query()->whereKey($personneId)->exists()) {
            abort(404, 'Personne introuvable.');
        }

        $id = RelationFamiliale::query()
            ->where('actif', true)
            ->where(function ($query) use ($personneId) {
                $query->where('id_personne_1', $personneId)->orWhere('id_personne_2', $personneId);
            })
            ->value('id_famille');

        $id ??= Famille::query()->where('responsable_legal_id', $personneId)->value('id_famille');

        return $this->charger($id) ?? abort(404, 'Aucun regroupement familial pour cette personne.');
    }

    public function trouver(string $id): Famille
    {
        return $this->charger($id) ?? abort(404, 'Regroupement familial introuvable.');
    }

    public function creer(array $donnees): Famille
    {
        $this->personneExiste($donnees['responsable_legal_id'] ?? null);

        $famille = Famille::query()->create([
            'id_famille' => (string) Str::uuid(),
            'nom_famille' => $donnees['nom_famille'],
            'adresse' => $donnees['adresse'] ?? null,
            'telephone_principal' => $donnees['telephone_principal'] ?? null,
            'responsable_legal_id' => $donnees['responsable_legal_id'] ?? null,
        ]);

        return $this->trouver($famille->id_famille);
    }

    public function modifier(Famille $famille, array $donnees): Famille
    {
        if (array_key_exists('responsable_legal_id', $donnees)) {
            $this->personneExiste($donnees['responsable_legal_id']);
        }
        $famille->fill($donnees);
        $famille->save();

        return $this->trouver($famille->id_famille);
    }

    public function ajouterRelation(Famille $famille, array $donnees): RelationFamiliale
    {
        $type = $donnees['type_relation'];
        if (! in_array($type, self::TYPES, true)) {
            abort(422, 'Type de relation inconnu.');
        }
        if ($donnees['id_personne_1'] === $donnees['id_personne_2']) {
            abort(422, 'Une relation relie deux personnes distinctes.');
        }
        $this->personneExiste($donnees['id_personne_1']);
        $this->personneExiste($donnees['id_personne_2']);

        $existante = $this->relationEntre($famille->id_famille, $donnees['id_personne_1'], $donnees['id_personne_2']);
        if ($existante) {
            $existante->type_relation = $type;
            $existante->actif = true;
            $existante->date_fin = null;
            $existante->save();

            return $existante->load(['personne1', 'personne2']);
        }

        return RelationFamiliale::query()->create([
            'id_relation' => (string) Str::uuid(),
            'id_famille' => $famille->id_famille,
            'id_personne_1' => $donnees['id_personne_1'],
            'id_personne_2' => $donnees['id_personne_2'],
            'type_relation' => $type,
            'date_debut' => now(),
            'actif' => true,
        ])->load(['personne1', 'personne2']);
    }

    public function retirerRelation(Famille $famille, string $relationId): void
    {
        $relation = RelationFamiliale::query()
            ->where('id_famille', $famille->id_famille)
            ->where('id_relation', $relationId)
            ->where('actif', true)
            ->first();
        if (! $relation) {
            abort(404, 'Relation familiale introuvable.');
        }
        $relation->actif = false;
        $relation->date_fin = now();
        $relation->save();
    }

    private function charger(?string $id): ?Famille
    {
        if (! $id) {
            return null;
        }

        return Famille::query()
            ->with(['relations' => fn ($query) => $query->where('actif', true)->with(['personne1', 'personne2'])])
            ->find($id);
    }

    private function personneExiste(?string $personneId): void
    {
        if ($personneId && ! Personne::query()->whereKey($personneId)->exists()) {
            abort(404, 'Personne introuvable.');
        }
    }

    private function relationEntre(string $familleId, string $personneA, string $personneB): ?RelationFamiliale
    {
        return RelationFamiliale::query()
            ->where('id_famille', $familleId)
            ->where(function ($query) use ($personneA, $personneB) {
                $query->where(function ($paire) use ($personneA, $personneB) {
                    $paire->where('id_personne_1', $personneA)->where('id_personne_2', $personneB);
                })->orWhere(function ($paire) use ($personneA, $personneB) {
                    $paire->where('id_personne_1', $personneB)->where('id_personne_2', $personneA);
                });
            })
            ->first();
    }
}
