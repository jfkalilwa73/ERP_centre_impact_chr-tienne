<?php

namespace Tests\Feature\Acces;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AttribuerRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/acces/comptes/1/roles', [
            'id_role' => (string) Str::uuid(),
        ])->assertUnauthorized();
    }

    public function test_id_role_est_obligatoire(): void
    {
        $user = $this->seConnecter();

        $this->postJson("/api/v1/acces/comptes/{$user->id}/roles", [])
            ->assertUnprocessable();
    }

    public function test_compte_introuvable(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/comptes/99999/roles', [
            'id_role' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_role_introuvable(): void
    {
        $user = $this->seConnecter();

        $this->postJson("/api/v1/acces/comptes/{$user->id}/roles", [
            'id_role' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_attribuer_un_role_reussit(): void
    {
        $user = $this->seConnecter();
        $idRole = $this->creerRole();

        $response = $this->postJson("/api/v1/acces/comptes/{$user->id}/roles", [
            'id_role' => $idRole,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.id_role', $idRole)
            ->assertJsonPath('data.actif', true);

        $this->assertDatabaseHas('affecter_role_metier', [
            'user_id' => $user->id,
            'id_role' => $idRole,
            'actif' => true,
        ]);
    }

    public function test_role_deja_attribue_est_refuse(): void
    {
        $user = $this->seConnecter();
        $idRole = $this->creerRole();

        $this->postJson("/api/v1/acces/comptes/{$user->id}/roles", [
            'id_role' => $idRole,
        ])->assertCreated();

        $this->postJson("/api/v1/acces/comptes/{$user->id}/roles", [
            'id_role' => $idRole,
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

    private function creerRole(): string
    {
        $response = $this->postJson('/api/v1/acces/roles', [
            'code' => 'RESP_ACCUEIL',
            'nom' => 'Responsable accueil',
        ])->assertCreated();

        return $response->json('data.id_role');
    }
}