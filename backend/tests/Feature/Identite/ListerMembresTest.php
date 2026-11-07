<?php

namespace Tests\Feature\Identite;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListerMembresTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/membres')->assertUnauthorized();
    }

    public function test_liste_paginee_avec_filtre_statut_et_recherche(): void
    {
        $this->seConnecter();

        $idJean = $this->creerPersonne('Kabila', 'Jean');
        $idPaul = $this->creerPersonne('Mwamba', 'Paul');

        $this->postJson("/api/v1/personnes/{$idJean}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated();

        $this->postJson("/api/v1/personnes/{$idPaul}/membre", [
            'dateIntegration' => '2026-02-01',
            'statutMembre' => 'actif',
        ])->assertCreated();

        $liste = $this->getJson('/api/v1/membres')->assertOk();
        $this->assertCount(2, $liste->json('data'));
        $this->assertSame(2, $liste->json('pagination.total'));
        $this->assertSame(1, $liste->json('pagination.page'));
        $this->assertSame(20, $liste->json('pagination.limit'));
        $this->assertNotEmpty($liste->json('data.0.numeroMembre'));
        $this->assertNotEmpty($liste->json('data.0.nom'));

        $actifs = $this->getJson('/api/v1/membres?statut=actif')->assertOk();
        $this->assertCount(1, $actifs->json('data'));
        $this->assertSame('actif', $actifs->json('data.0.statutMembre'));
        $this->assertSame('Mwamba', $actifs->json('data.0.nom'));

        $recherche = $this->getJson('/api/v1/membres?q=Kabila')->assertOk();
        $this->assertCount(1, $recherche->json('data'));
        $this->assertSame('Kabila', $recherche->json('data.0.nom'));

        $page = $this->getJson('/api/v1/membres?page=1&limit=1')->assertOk();
        $this->assertCount(1, $page->json('data'));
        $this->assertSame(2, $page->json('pagination.total'));
        $this->assertSame(1, $page->json('pagination.limit'));
    }

    public function test_statut_inconnu_est_refuse(): void
    {
        $this->seConnecter();

        $this->getJson('/api/v1/membres?statut=inconnu')->assertUnprocessable();
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

    private function creerPersonne(string $nom, string $prenom): string
    {
        return Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => $nom,
            'prenom' => $prenom,
            'statut' => 'actif',
        ])->id_personne;
    }
}