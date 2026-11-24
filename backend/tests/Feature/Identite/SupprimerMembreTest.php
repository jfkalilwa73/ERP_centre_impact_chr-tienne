<?php

namespace Tests\Feature\Identite;

use App\Models\AuditLog;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SupprimerMembreTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->deleteJson('/api/v1/membres/'.Str::uuid())->assertUnauthorized();
    }

    public function test_membre_introuvable(): void
    {
        $this->seConnecter();

        $this->deleteJson('/api/v1/membres/'.Str::uuid())->assertNotFound();
    }

    public function test_membre_actif_est_refuse(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $idMembre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'actif',
        ])->assertCreated()->json('idMembre');

        $this->deleteJson("/api/v1/membres/{$idMembre}")->assertStatus(409);

        $this->assertDatabaseHas('membre', [
            'id_membre' => $idMembre,
            'statut_membre' => 'actif',
        ]);
    }

    public function test_membre_en_attente_peut_etre_supprime(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $idMembre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated()->json('idMembre');

        $this->deleteJson("/api/v1/membres/{$idMembre}")->assertNoContent();

        $this->assertDatabaseMissing('membre', [
            'id_membre' => $idMembre,
        ]);

        $this->assertTrue(
            AuditLog::query()
                ->where('action', 'MEMBRE_DELETED')
                ->where('entite_type', 'membre')
                ->where('id_entite', $idMembre)
                ->exists()
        );
    }

    public function test_membre_inactif_avec_historique_peut_etre_supprime(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $idMembre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated()->json('idMembre');

        $this->patchJson("/api/v1/membres/{$idMembre}", [
            'statutMembre' => 'inactif',
            'motif' => 'Départ',
        ])->assertOk();

        $this->deleteJson("/api/v1/membres/{$idMembre}")->assertNoContent();

        $this->assertDatabaseMissing('membre', [
            'id_membre' => $idMembre,
        ]);
        $this->assertDatabaseMissing('historique_statut_membre', [
            'id_membre' => $idMembre,
        ]);
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