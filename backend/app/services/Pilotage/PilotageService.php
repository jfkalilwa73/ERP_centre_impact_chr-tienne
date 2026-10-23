<?php

namespace App\Services\Pilotage;

use App\Models\AffecterDepartement;
use App\Models\AppartenirFamille;
use App\Models\PilotageDocument;
use App\Models\User;

class PilotageService
{
    public const CLES = [
        'activites',
        'activitesFamille',
        'budget',
        'objectifs',
        'plans',
        'rapports',
        'projets',
        'risques',
        'decisions',
        'equipe',
        'circulations',
        'demandes',
    ];

    private const LARGE = [
        'membres.read',
        'familles.read',
        'comptes.read',
        'roles.read',
        'roles.manage',
        'audit.read',
        'systeme.manage',
    ];

    private const LECTURE = [
        'activites.read',
        'budget.read',
        'objectifs.read',
        'projets.read',
        'rapports.read',
        'rapports.consolidate',
        'demandes.read',
        'alertes.read',
        'departements.read',
        'familles.read',
        'equipes.read',
        'performances.read',
        'finance.read',
        'roles.manage',
        'systeme.manage',
    ];

    private const ECRITURE = [
        'activites.create',
        'activites.update',
        'budget.request',
        'objectifs.manage',
        'projets.manage',
        'rapports.create',
        'equipes.manage',
        'demandes.create',
        'departements.update',
        'familles.update',
        'finance.manage',
        'roles.manage',
        'systeme.manage',
    ];

    public function peutLire(User $user): bool
    {
        return $this->aUnDroit($user, self::LECTURE);
    }

    public function peutEcrire(User $user): bool
    {
        return $this->aUnDroit($user, self::ECRITURE);
    }

    public function tout(User $user): array
    {
        $docs = $this->documents();
        foreach (self::CLES as $cle) {
            $docs[$cle] = $docs[$cle] ?? $this->vide($cle);
        }

        if (! $this->estLarge($this->codes($user))) {
            $docs = $this->filtrer($docs, $this->unites($user));
        }

        $meta = PilotageDocument::query()->find('meta');
        $docs['meta'] = is_array($meta?->contenu) ? $meta->contenu : ['seeded' => false];

        return $docs;
    }

    public function enregistrer(User $user, array $incoming): array
    {
        $codes = $this->codes($user);
        $large = $this->estLarge($codes);
        $unites = $large ? [] : $this->unites($user);

        if (! $large && $unites === []) {
            abort(403, 'Aucune unité ne vous est affectée.');
        }

        unset($incoming['meta']);
        $current = $this->documents();
        $merged = $large
            ? $this->remplacer($current, $incoming)
            : $this->fusionner($current, $incoming, $unites);

        foreach ($merged as $cle => $contenu) {
            if (! in_array($cle, self::CLES, true)) {
                continue;
            }
            $this->ecrire($cle, $contenu);
        }

        if ($large) {
            $this->ecrire('meta', ['seeded' => true]);
        }

        return $this->tout($user);
    }

    private function aUnDroit(User $user, array $attendus): bool
    {
        return array_intersect($this->codes($user), $attendus) !== [];
    }

    private function estLarge(array $codes): bool
    {
        return array_intersect($codes, self::LARGE) !== [];
    }

    private function codes(User $user): array
    {
        $user->loadMissing('rolesMetier.permissions');

        return $user->rolesMetier
            ->filter(fn ($role) => (bool) $role->actif)
            ->flatMap(fn ($role) => $role->permissions)
            ->filter(fn ($permission) => (bool) $permission->actif)
            ->pluck('code')
            ->unique()
            ->values()
            ->all();
    }

    private function unites(User $user): array
    {
        $personneId = $user->personne?->id_personne;
        if (! $personneId) {
            return [];
        }

        $departements = AffecterDepartement::query()
            ->where('id_personne', $personneId)
            ->where('actif', true)
            ->pluck('id_departement')
            ->all();

        $familles = AppartenirFamille::query()
            ->where('id_personne', $personneId)
            ->where('actif', true)
            ->pluck('id_famille')
            ->all();

        return array_values(array_unique([...$departements, ...$familles]));
    }

    private function documents(): array
    {
        $docs = [];
        foreach (PilotageDocument::query()->where('cle', '!=', 'meta')->get() as $row) {
            $docs[$row->cle] = is_array($row->contenu) ? $row->contenu : [];
        }

        return $docs;
    }

    private function ecrire(string $cle, array $contenu): void
    {
        PilotageDocument::query()->updateOrCreate(
            ['cle' => $cle],
            ['contenu' => $contenu],
        );
    }

    private function remplacer(array $current, array $incoming): array
    {
        foreach (self::CLES as $cle) {
            if (array_key_exists($cle, $incoming) && is_array($incoming[$cle])) {
                $current[$cle] = $incoming[$cle];
            }
        }

        return $current;
    }

    private function fusionner(array $current, array $incoming, array $ids): array
    {
        foreach (['activites', 'activitesFamille', 'objectifs', 'plans'] as $cle) {
            if (! array_key_exists($cle, $incoming)) {
                continue;
            }
            $current[$cle] = $this->fusionnerCarte(
                $this->carte($current[$cle] ?? []),
                $this->carte($incoming[$cle]),
                $ids,
            );
        }

        if (isset($incoming['budget']) && is_array($incoming['budget'])) {
            $budget = is_array($current['budget'] ?? null) ? $current['budget'] : [];
            $current['budget'] = [
                'enveloppes' => $this->fusionnerCarte($this->carte($budget['enveloppes'] ?? []), $this->carte($incoming['budget']['enveloppes'] ?? []), $ids),
                'depenses' => $this->fusionnerCarte($this->carte($budget['depenses'] ?? []), $this->carte($incoming['budget']['depenses'] ?? []), $ids),
                'rentrees' => $this->fusionnerCarte($this->carte($budget['rentrees'] ?? []), $this->carte($incoming['budget']['rentrees'] ?? []), $ids),
            ];
        }

        if (isset($incoming['equipe']) && is_array($incoming['equipe'])) {
            $equipe = is_array($current['equipe'] ?? null) ? $current['equipe'] : [];
            $current['equipe'] = [
                'fiches' => $this->fusionnerCarte($this->carte($equipe['fiches'] ?? []), $this->carte($incoming['equipe']['fiches'] ?? []), $ids),
                'creneaux' => $this->fusionnerCarte($this->carte($equipe['creneaux'] ?? []), $this->carte($incoming['equipe']['creneaux'] ?? []), $ids),
            ];
        }

        $current['rapports'] = $this->fusionnerListe(
            $this->liste($current['rapports'] ?? []),
            $this->liste($incoming['rapports'] ?? []),
            $ids,
            fn (array $item) => $item['idDepartementSource'] ?? null,
            false,
            array_key_exists('rapports', $incoming),
        );

        $projetUnits = $this->unitesProjets(array_merge(
            $this->liste($current['projets'] ?? []),
            $this->liste($incoming['projets'] ?? []),
        ));

        $current['projets'] = $this->fusionnerListe(
            $this->liste($current['projets'] ?? []),
            $this->liste($incoming['projets'] ?? []),
            $ids,
            fn (array $item) => $item['idDepartement'] ?? null,
            false,
            array_key_exists('projets', $incoming),
        );

        $current['risques'] = $this->fusionnerListe(
            $this->liste($current['risques'] ?? []),
            $this->liste($incoming['risques'] ?? []),
            $ids,
            fn (array $item) => $projetUnits[$item['idProjet'] ?? ''] ?? null,
            false,
            array_key_exists('risques', $incoming),
        );

        $current['decisions'] = $this->fusionnerListe(
            $this->liste($current['decisions'] ?? []),
            $this->liste($incoming['decisions'] ?? []),
            $ids,
            fn (array $item) => $item['idDepartement'] ?? null,
            true,
            array_key_exists('decisions', $incoming),
        );

        $current['circulations'] = $this->fusionnerListe(
            $this->liste($current['circulations'] ?? []),
            $this->liste($incoming['circulations'] ?? []),
            $ids,
            fn (array $item) => $item['idDepartementSource'] ?? null,
            false,
            array_key_exists('circulations', $incoming),
        );

        $current['demandes'] = $this->fusionnerListe(
            $this->liste($current['demandes'] ?? []),
            $this->liste($incoming['demandes'] ?? []),
            $ids,
            fn (array $item) => $item['idDepartement'] ?? null,
            false,
            array_key_exists('demandes', $incoming),
        );

        return $current;
    }

    private function filtrer(array $docs, array $ids): array
    {
        foreach (['activites', 'activitesFamille', 'objectifs', 'plans'] as $cle) {
            $docs[$cle] = $this->filtrerCarte($this->carte($docs[$cle] ?? []), $ids);
        }

        $budget = is_array($docs['budget'] ?? null) ? $docs['budget'] : [];
        $docs['budget'] = [
            'enveloppes' => $this->filtrerCarte($this->carte($budget['enveloppes'] ?? []), $ids),
            'depenses' => $this->filtrerCarte($this->carte($budget['depenses'] ?? []), $ids),
            'rentrees' => $this->filtrerCarte($this->carte($budget['rentrees'] ?? []), $ids),
        ];

        $equipe = is_array($docs['equipe'] ?? null) ? $docs['equipe'] : [];
        $docs['equipe'] = [
            'fiches' => $this->filtrerCarte($this->carte($equipe['fiches'] ?? []), $ids),
            'creneaux' => $this->filtrerCarte($this->carte($equipe['creneaux'] ?? []), $ids),
        ];

        $docs['rapports'] = $this->filtrerListe($this->liste($docs['rapports'] ?? []), $ids, fn (array $item) => $item['idDepartementSource'] ?? null, false);
        $projetUnits = $this->unitesProjets($this->liste($docs['projets'] ?? []));
        $docs['projets'] = $this->filtrerListe($this->liste($docs['projets'] ?? []), $ids, fn (array $item) => $item['idDepartement'] ?? null, false);
        $docs['risques'] = $this->filtrerListe(
            $this->liste($docs['risques'] ?? []),
            $ids,
            fn (array $item) => $projetUnits[$item['idProjet'] ?? ''] ?? null,
            false,
        );
        $docs['decisions'] = $this->filtrerListe($this->liste($docs['decisions'] ?? []), $ids, fn (array $item) => $item['idDepartement'] ?? null, true);
        $docs['circulations'] = $this->filtrerListe($this->liste($docs['circulations'] ?? []), $ids, fn (array $item) => $item['idDepartementSource'] ?? null, false);
        $docs['demandes'] = $this->filtrerListe($this->liste($docs['demandes'] ?? []), $ids, fn (array $item) => $item['idDepartement'] ?? null, false);

        return $docs;
    }

    private function filtrerCarte(array $carte, array $ids): array
    {
        $set = array_flip($ids);
        $out = [];
        foreach ($carte as $id => $value) {
            if (isset($set[(string) $id])) {
                $out[$id] = $value;
            }
        }

        return $out;
    }

    private function filtrerListe(array $liste, array $ids, callable $unite, bool $garderSansUnite): array
    {
        $set = array_flip($ids);

        return array_values(array_filter($liste, function ($item) use ($set, $unite, $garderSansUnite) {
            if (! is_array($item)) {
                return false;
            }
            $id = $unite($item);
            if ($id === null || $id === '') {
                return $garderSansUnite;
            }

            return isset($set[$id]);
        }));
    }

    private function fusionnerCarte(array $existante, array $entrante, array $ids): array
    {
        $set = array_flip($ids);
        foreach ($entrante as $id => $value) {
            if (isset($set[(string) $id])) {
                $existante[$id] = $value;
            }
        }
        foreach ($ids as $id) {
            if (! array_key_exists($id, $entrante)) {
                unset($existante[$id]);
            }
        }

        return $existante;
    }

    private function fusionnerListe(
        array $existante,
        array $entrante,
        array $ids,
        callable $unite,
        bool $conserverSansUnite,
        bool $fournie,
    ): array {
        if (! $fournie) {
            return $existante;
        }

        $set = array_flip($ids);
        $conserves = array_values(array_filter($existante, function ($item) use ($set, $unite, $conserverSansUnite) {
            if (! is_array($item)) {
                return false;
            }
            $id = $unite($item);
            if ($id === null || $id === '') {
                return $conserverSansUnite;
            }

            return ! isset($set[$id]);
        }));
        $miens = array_values(array_filter($entrante, function ($item) use ($set, $unite) {
            if (! is_array($item)) {
                return false;
            }
            $id = $unite($item);

            return $id !== null && $id !== '' && isset($set[$id]);
        }));

        return array_values([...$miens, ...$conserves]);
    }

    private function unitesProjets(array $projets): array
    {
        $map = [];
        foreach ($projets as $projet) {
            if (is_array($projet) && isset($projet['id'], $projet['idDepartement'])) {
                $map[$projet['id']] = $projet['idDepartement'];
            }
        }

        return $map;
    }

    private function carte(mixed $value): array
    {
        if (! is_array($value) || array_is_list($value)) {
            return [];
        }

        return $value;
    }

    private function liste(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }
        if ($value === []) {
            return [];
        }

        return array_is_list($value) ? $value : [];
    }

    private function vide(string $cle): array
    {
        return match ($cle) {
            'budget' => ['enveloppes' => [], 'depenses' => [], 'rentrees' => []],
            'equipe' => ['fiches' => [], 'creneaux' => []],
            default => [],
        };
    }
}
