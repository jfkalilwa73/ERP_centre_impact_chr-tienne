<?php

namespace App\Services\Famille;

use App\Models\AppartenirFamille;
use App\Models\FamilleImpact;
use Illuminate\Support\Str;

class FamilleImpactService
{
    public function lister(int $page, int $limit, ?string $recherche)
    {
        $query = FamilleImpact::query()->orderBy('nom');
        if ($recherche) {
            $terme = '%'.$recherche.'%';
            $query->where(fn ($q) => $q->where('nom', 'ilike', $terme)->orWhere('code', 'ilike', $terme)->orWhere('zone', 'ilike', $terme));
        }
        return $query->paginate($limit, ['*'], 'page', $page);
    }

    public function trouver(string $id): FamilleImpact
    {
        return FamilleImpact::query()->find($id) ?? abort(404, 'Famille d’impact introuvable.');
    }

    public function creer(array $donnees): FamilleImpact
    {
        $this->verifierUnicite($donnees);
        return FamilleImpact::query()->create(['id_famille' => (string) Str::uuid(), ...$donnees]);
    }

    public function modifier(FamilleImpact $famille, array $donnees): FamilleImpact
    {
        $this->verifierUnicite($donnees, $famille);
        $famille->fill($donnees);
        $famille->save();
        return $famille;
    }

    public function supprimer(FamilleImpact $famille): void
    {
        if (AppartenirFamille::query()->where('id_famille', $famille->id_famille)->exists()) {
            abort(409, 'Cette famille possède un historique d’appartenances et ne peut pas être supprimée.');
        }
        $famille->delete();
    }

    private function verifierUnicite(array $donnees, ?FamilleImpact $famille = null): void
    {
        foreach (['code', 'nom'] as $field) {
            if (isset($donnees[$field]) && FamilleImpact::query()->where($field, $donnees[$field])
                ->when($famille, fn ($q) => $q->where('id_famille', '!=', $famille->id_famille))->exists()) {
                abort(409, 'Le code ou le nom de cette famille est déjà utilisé.');
            }
        }
    }
}
