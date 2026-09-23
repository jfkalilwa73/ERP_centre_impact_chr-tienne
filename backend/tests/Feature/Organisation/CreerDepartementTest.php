<?php

namespace Tests\Feature\Organisation;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreerDepartementTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/organisation/departements', [
            'code' => 'DEPT-ACCUEIL',
            'nom' => 'Département Accueil',
            'id_site' => (string) Str::uuid(),
        ])->assertUnauthorized();
    }

    public function test_champs_obligatoires(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/organisation/departements', [])
            ->assertUnprocessable();
    }

    public function test_site_introuvable(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/organisation/departements', [
            'code' => 'DEPT-ACCUEIL',
            'nom' => 'Département Accueil',
            'id_site' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_creer_un_departement_reussit(): void
    {
        $this->seConnecter();
        $idSite = $this->creerSite();

        $response = $this->postJson('/api/v1/organisation/departements', [
            'code' => 'DEPT-ACCUEIL',
            'nom' => 'Département Accueil',
            'id_site' => $idSite,
            'mission' => 'Accueil des membres et visiteurs',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'DEPT-ACCUEIL')
            ->assertJsonPath('data.nom', 'Département Accueil')
            ->assertJsonPath('data.id_site', $idSite)
            ->assertJsonPath('data.actif', true);

        $this->assertNotEmpty($response->json('data.id_departement'));
        $this->assertDatabaseHas('departement', [
            'code' => 'DEPT-ACCUEIL',
            'id_site' => $idSite,
        ]);
    }

    public function test_code_deja_utilise_est_refuse(): void
    {
        $this->seConnecter();
        $idSite = $this->creerSite();

        $this->postJson('/api/v1/organisation/departements', [
            'code' => 'DEPT-ACCUEIL',
            'nom' => 'Département Accueil',
            'id_site' => $idSite,
        ])->assertCreated();

        $this->postJson('/api/v1/organisation/departements', [
            'code' => 'DEPT-ACCUEIL',
            'nom' => 'Autre nom',
            'id_site' => $idSite,
        ])->assertStatus(409);
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

    private function creerSite(): string
    {
        $response = $this->postJson('/api/v1/organisation/sites', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Site Gombe',
            'telephone' => '+243810000002',
        ])->assertCreated();

        return $response->json('data.id_site');
    }
}