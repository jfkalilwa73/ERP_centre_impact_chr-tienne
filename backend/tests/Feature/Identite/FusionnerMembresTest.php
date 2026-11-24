<?php

namespace Tests\Feature\Identite;

use App\Models\AuditLog;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class FusionnerMembresTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/membres/'.Str::uuid().'/merge', [
            'idMembreSource' => (string) Str::uuid(),
        ])->assertUnauthorized();
    }

    public function test_fusion_refuse_soi_meme(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne('Kabila', 'Jean');

        $idMembre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated()->json('idMembre');

        $this->postJson("/api/v1/membres/{$idMembre}/merge", [
            'idMembreSource' => $idMembre,
        ])->assertUnprocessable();
    }

    public function test_fusionner_deux_membres_conserve_la_cible(): void
    {
        $this->seConnecter();

        $idCible = $this->creerPersonne('Kabila', 'Jean');
        $idSource = $this->creerPersonne('Kabila', 'Jean-Claude');

        $cible = $this->postJson("/api/v1/personnes/{$idCible}/membre", [
            'dateIntegration' => '2026-03-01',
            'statutMembre' => 'en_attente',
        ])->assertCreated();

        $source = $this->postJson("/api/v1/personnes/{$idSource}/membre", [
            'dateIntegration' => '2025-01-10',
            'statutMembre' => 'actif',
        ])->assertCreated();

        $idMembreCible = $cible->json('idMembre');
        $idMembreSource = $source->json('idMembre');
        $numeroCible = $cible->json('numeroMembre');

        $this->postJson("/api/v1/membres/{$idMembreCible}/merge", [
            'idMembreSource' => $idMembreSource,
        ])->assertOk()
            ->assertJsonPath('idMembre', $idMembreCible)
            ->assertJsonPath('numeroMembre', $numeroCible)
            ->assertJsonPath('dateIntegration', '2025-01-10');

        $this->assertDatabaseMissing('membre', [
            'id_membre' => $idMembreSource,
        ]);

        $this->assertTrue(
            AuditLog::query()
                ->where('action', 'MEMBRE_MERGED')
                ->where('id_entite', $idMembreCible)
                ->exists()
        );
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