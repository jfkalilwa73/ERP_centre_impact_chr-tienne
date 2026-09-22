<?php

namespace Tests\Feature\Acces;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreerRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/acces/roles', [
            'code' => 'RESP_ACCUEIL',
            'nom' => 'Responsable accueil',
        ])->assertUnauthorized();
    }

    public function test_code_et_nom_sont_obligatoires(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/roles', [])
            ->assertUnprocessable();
    }

    public function test_code_invalide_est_refuse(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/roles', [
            'code' => 'accueil',
            'nom' => 'Responsable accueil',
        ])->assertUnprocessable();
    }

    public function test_creer_un_role_reussit(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/v1/acces/roles', [
            'code' => 'RESP_ACCUEIL',
            'nom' => 'Responsable accueil',
            'description' => 'Accueil des membres et visiteurs',
            'niveau_confidentialite' => 2,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'RESP_ACCUEIL')
            ->assertJsonPath('data.nom', 'Responsable accueil')
            ->assertJsonPath('data.niveau_confidentialite', 2)
            ->assertJsonPath('data.actif', true);

        $this->assertNotEmpty($response->json('data.id_role'));
        $this->assertDatabaseHas('role_metier', [
            'code' => 'RESP_ACCUEIL',
            'nom' => 'Responsable accueil',
        ]);
    }

    public function test_code_deja_utilise_est_refuse(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/roles', [
            'code' => 'RESP_ACCUEIL',
            'nom' => 'Responsable accueil',
        ])->assertCreated();

        $this->postJson('/api/v1/acces/roles', [
            'code' => 'RESP_ACCUEIL',
            'nom' => 'Autre nom',
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
}