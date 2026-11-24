<?php

namespace Tests\Feature\Famille;

use App\Models\AffecterDepartement;
use App\Models\Departement;
use App\Models\Personne;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class FamilleDiscipleTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/familles-disciples')->assertUnauthorized();
    }

    public function test_creer_lister_admettre_et_retirer(): void
    {
        $this->seConnecter();
        $siteId = $this->site();
        $depId = $this->departement($siteId);
        $idPersonne = $this->personne();

        AffecterDepartement::query()->create([
            'id_personne' => $idPersonne,
            'id_departement' => $depId,
            'fonction' => 'membre',
            'date_debut' => now(),
            'actif' => true,
        ]);

        $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'actif',
        ])->assertCreated();

        $famille = $this->postJson('/api/v1/familles-disciples', [
            'nom' => 'Famille Royal',
            'periodeDebut' => '2026-09-01',
            'responsableId' => $idPersonne,
        ])->assertCreated()
            ->assertJsonPath('nom', 'Famille Royal')
            ->assertJsonPath('modeSimulation', false);

        $idFamille = $famille->json('idFamilleDisciple');

        $liste = $this->getJson('/api/v1/familles-disciples')->assertOk();
        $this->assertSame(1, $liste->json('pagination.total'));
        $this->assertFalse($liste->json('modeSimulation'));

        $composition = $this->postJson("/api/v1/familles-disciples/{$idFamille}/membres", [
            'idPersonne' => $idPersonne,
            'dateAccueil' => '2026-10-01',
        ])->assertCreated();

        $this->getJson("/api/v1/familles-disciples/{$idFamille}")
            ->assertOk()
            ->assertJsonPath('compositions.0.idPersonne', $idPersonne);

        $this->getJson("/api/v1/personnes/{$idPersonne}/famille-disciple")
            ->assertOk()
            ->assertJsonPath('idFamilleDisciple', $idFamille)
            ->assertJsonPath('nomFamilleDisciple', 'Famille Royal');

        $this->deleteJson(
            "/api/v1/familles-disciples/{$idFamille}/membres/".$composition->json('idComposition')
        )->assertNoContent();
    }

    private function seConnecter(): User
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        return $user;
    }

    private function personne(): string
    {
        return Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => 'Nkulu',
            'prenom' => 'Sarah',
            'statut' => 'actif',
        ])->id_personne;
    }

    private function site(): string
    {
        return Site::query()->create([
            'id_site' => (string) Str::uuid(),
            'nom' => 'Site Test',
            'code' => 'ST',
            'actif' => true,
        ])->id_site;
    }

    private function departement(string $siteId): string
    {
        return Departement::query()->create([
            'id_departement' => (string) Str::uuid(),
            'code' => 'ACC',
            'nom' => 'Accueil',
            'id_site' => $siteId,
            'actif' => true,
        ])->id_departement;
    }
}