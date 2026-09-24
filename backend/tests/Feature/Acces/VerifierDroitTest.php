<?php

namespace Tests\Feature\Acces;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifierDroitTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/acces/comptes/1/permissions/finances.read')
            ->assertUnauthorized();
    }

    public function test_compte_introuvable(): void
    {
        $this->seConnecter();

        $this->getJson('/api/v1/acces/comptes/99999/permissions/finances.read')
            ->assertNotFound();
    }

    public function test_sans_droit_autorise_est_faux(): void
    {
        $user = $this->seConnecter();

        $this->getJson("/api/v1/acces/comptes/{$user->id}/permissions/finances.read")
            ->assertOk()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.permission_code', 'finances.read')
            ->assertJsonPath('data.autorise', false)
            ->assertJsonPath('data.roles_source', []);
    }

    public function test_avec_chaine_complete_autorise_est_vrai(): void
    {
        $user = $this->seConnecter();
        $idRole = $this->creerRole();
        $idPermission = $this->creerPermission();

        $this->postJson("/api/v1/acces/roles/{$idRole}/permissions", [
            'id_permission' => $idPermission,
        ])->assertCreated();

        $this->postJson("/api/v1/acces/comptes/{$user->id}/roles", [
            'id_role' => $idRole,
        ])->assertCreated();

        $this->getJson("/api/v1/acces/comptes/{$user->id}/permissions/finances.read")
            ->assertOk()
            ->assertJsonPath('data.autorise', true)
            ->assertJsonPath('data.permission_code', 'finances.read')
            ->assertJsonPath('data.roles_source.0', $idRole);
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