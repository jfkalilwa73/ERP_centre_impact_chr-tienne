<?php

namespace Tests\Feature\Audit;

use App\Models\User;
use App\Services\Audit\AuditLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ConsulterAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/audit/logs')->assertUnauthorized();
    }

    public function test_liste_vide_reussit(): void
    {
        $this->seConnecter();

        $this->getJson('/api/v1/audit/logs')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_liste_les_traces_existantes(): void
    {
        $user = $this->seConnecter();
        $idEntite = (string) Str::uuid();

        app(AuditLogService::class)->enregistrer([
            'user_id' => $user->id,
            'action' => 'SEEDER_TEST',
            'entite_type' => 'personne',
            'id_entite' => $idEntite,
            'nouvelles_valeurs' => ['nom' => 'Nuru'],
        ]);

        $response = $this->getJson('/api/v1/audit/logs');

        $response->assertOk()
            ->assertJsonPath('data.0.action', 'SEEDER_TEST')
            ->assertJsonPath('data.0.entite_type', 'personne')
            ->assertJsonPath('data.0.id_entite', $idEntite)
            ->assertJsonPath('data.0.user_id', $user->id);

        $this->assertNotEmpty($response->json('data.0.id_audit'));
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