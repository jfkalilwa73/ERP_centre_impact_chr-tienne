<?php

namespace Tests\Feature\Acces;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreerPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'read',
        ])->assertUnauthorized();
    }

    public function test_champs_obligatoires(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/permissions', [])
            ->assertUnprocessable();
    }

    public function test_code_invalide_est_refuse(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/permissions', [
            'code' => 'FINANCES_READ',
            'module' => 'finances',
            'action' => 'read',
        ])->assertUnprocessable();
    }

    public function test_creer_une_permission_reussit(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'read',
            'description' => 'Consulter les données financières',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'finances.read')
            ->assertJsonPath('data.module', 'finances')
            ->assertJsonPath('data.action', 'read')
            ->assertJsonPath('data.actif', true);

        $this->assertNotEmpty($response->json('data.id_permission'));
        $this->assertDatabaseHas('permission_metier', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'read',
        ]);
    }

    public function test_code_deja_utilise_est_refuse(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'read',
        ])->assertCreated();

        $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'write',
        ])->assertStatus(409);
    }

    public function test_couple_module_action_deja_utilise_est_refuse(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'read',
        ])->assertCreated();

        $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.consulter',
            'module' => 'finances',
            'action' => 'read',
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