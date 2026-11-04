<?php

namespace Tests\Feature\Identite;

use App\Models\AuditLog;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreerMembreTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/personnes/'.Str::uuid().'/membre', [
            'dateIntegration' => '2026-01-15',
        ])->assertUnauthorized();
    }

    public function test_date_integration_obligatoire(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [])
            ->assertUnprocessable();
    }

    public function test_personne_introuvable(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/personnes/'.Str::uuid().'/membre', [
            'dateIntegration' => '2026-01-15',
        ])->assertNotFound();
    }

    public function test_creer_un_membre_genere_le_numero(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $reponse = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated()
            ->assertJsonPath('idPersonne', $idPersonne)
            ->assertJsonPath('statutMembre', 'en_attente')
            ->assertJsonPath('dateIntegration', '2026-01-15');

        $this->assertMatchesRegularExpression('/^MEM-\d{4}-\d{4}$/', $reponse->json('numeroMembre'));
        $this->assertNotEmpty($reponse->json('idMembre'));

        $this->assertTrue(
            AuditLog::query()
                ->where('action', 'MEMBRE_CREATED')
                ->where('entite_type', 'membre')
                ->where('id_entite', $reponse->json('idMembre'))
                ->exists()
        );
    }

    public function test_une_personne_ne_peut_pas_etre_membre_deux_fois(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
        ])->assertCreated();

        $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-02-01',
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

    private function creerPersonne(): string
    {
        $personne = Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => 'Kabila',
            'prenom' => 'Jean',
            'statut' => 'actif',
        ]);

        return $personne->id_personne;
    }
}
