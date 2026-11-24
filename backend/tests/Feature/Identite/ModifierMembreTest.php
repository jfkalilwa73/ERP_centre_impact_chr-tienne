<?php

namespace Tests\Feature\Identite;

use App\Models\AuditLog;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ModifierMembreTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $id = (string) Str::uuid();
        $this->getJson("/api/v1/membres/{$id}")->assertUnauthorized();
        $this->putJson("/api/v1/membres/{$id}", [
            'dateIntegration' => '2026-03-01',
        ])->assertUnauthorized();
    }

    public function test_membre_introuvable(): void
    {
        $this->seConnecter();
        $id = (string) Str::uuid();

        $this->getJson("/api/v1/membres/{$id}")->assertNotFound();
        $this->putJson("/api/v1/membres/{$id}", [
            'dateIntegration' => '2026-03-01',
        ])->assertNotFound();
    }

    public function test_lire_et_modifier_la_date_d_integration(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $cree = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated();

        $idMembre = $cree->json('idMembre');

        $this->getJson("/api/v1/membres/{$idMembre}")
            ->assertOk()
            ->assertJsonPath('idMembre', $idMembre)
            ->assertJsonPath('idPersonne', $idPersonne)
            ->assertJsonPath('dateIntegration', '2026-01-15')
            ->assertJsonPath('nom', 'Kabila');

        $this->putJson("/api/v1/membres/{$idMembre}", [
            'dateIntegration' => '2026-03-01',
        ])->assertOk()
            ->assertJsonPath('dateIntegration', '2026-03-01')
            ->assertJsonPath('statutMembre', 'en_attente');

        $this->assertTrue(
            AuditLog::query()
                ->where('action', 'MEMBRE_UPDATED')
                ->where('entite_type', 'membre')
                ->where('id_entite', $idMembre)
                ->exists()
        );
    }

    public function test_date_integration_obligatoire(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $idMembre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
        ])->assertCreated()->json('idMembre');

        $this->putJson("/api/v1/membres/{$idMembre}", [])->assertUnprocessable();
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

    private function creerPersonne(): string
    {
        return Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => 'Kabila',
            'prenom' => 'Jean',
            'statut' => 'actif',
        ])->id_personne;
    }
}