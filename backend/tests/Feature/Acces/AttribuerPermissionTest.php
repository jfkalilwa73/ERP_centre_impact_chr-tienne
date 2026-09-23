<?php

namespace Tests\Feature\Acces;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AttribuerPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/acces/roles/'.Str::uuid().'/permissions', [
            'id_permission' => (string) Str::uuid(),
        ])->assertUnauthorized();
    }

    public function test_id_permission_est_obligatoire(): void
    {
        $this->seConnecter();
        $idRole = $this->creerRole();

        $this->postJson("/api/v1/acces/roles/{$idRole}/permissions", [])
            ->assertUnprocessable();
    }

    public function test_role_introuvable(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/acces/roles/'.Str::uuid().'/permissions', [
            'id_permission' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_permission_introuvable(): void
    {
        $this->seConnecter();
        $idRole = $this->creerRole();

        $this->postJson("/api/v1/acces/roles/{$idRole}/permissions", [
            'id_permission' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_attribuer_une_permission_reussit(): void
    {
        $this->seConnecter();
        $idRole = $this->creerRole();
        $idPermission = $this->creerPermission();

        $response = $this->postJson("/api/v1/acces/roles/{$idRole}/permissions", [
            'id_permission' => $idPermission,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.id_role', $idRole)
            ->assertJsonPath('data.id_permission', $idPermission);

        $this->assertDatabaseHas('attribuer_permission', [
            'id_role' => $idRole,
            'id_permission' => $idPermission,
        ]);
    }

    public function test_permission_deja_attribuee_est_refusee(): void
    {
        $this->seConnecter();
        $idRole = $this->creerRole();
        $idPermission = $this->creerPermission();

        $this->postJson("/api/v1/acces/roles/{$idRole}/permissions", [
            'id_permission' => $idPermission,
        ])->assertCreated();

        $this->postJson("/api/v1/acces/roles/{$idRole}/permissions", [
            'id_permission' => $idPermission,
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

    private function creerPermission(): string
    {
        $response = $this->postJson('/api/v1/acces/permissions', [
            'code' => 'finances.read',
            'module' => 'finances',
            'action' => 'read',
        ])->assertCreated();

        return $response->json('data.id_permission');
    }
}