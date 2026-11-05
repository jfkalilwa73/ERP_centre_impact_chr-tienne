<?php

namespace Tests\Feature\Identite;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ChangerStatutMembreTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->patchJson('/api/v1/membres/'.Str::uuid(), [
            'statutMembre' => 'actif',
        ])->assertUnauthorized();
    }

    public function test_membre_introuvable(): void
    {
        $this->seConnecter();

        $this->patchJson('/api/v1/membres/'.Str::uuid(), [
            'statutMembre' => 'actif',
        ])->assertNotFound();
    }

    public function test_changer_le_statut_ecrit_l_historique(): void
    {
        $user = $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $membre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated();

        $this->patchJson('/api/v1/membres/'.$membre->json('idMembre'), [
            'statutMembre' => 'actif',
            'motif' => 'Intégration confirmée',
        ])->assertOk()
            ->assertJsonPath('statutMembre', 'actif');

        $this->getJson('/api/v1/membres/'.$membre->json('idMembre').'/historique')
            ->assertOk()
            ->assertJsonPath('0.ancienStatut', 'en_attente')
            ->assertJsonPath('0.nouveauStatut', 'actif')
            ->assertJsonPath('0.motif', 'Intégration confirmée')
            ->assertJsonPath('0.changePar', $user->name);
    }

    public function test_meme_statut_est_refuse(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $membre = $this->postJson("/api/v1/personnes/{$idPersonne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated();

        $this->patchJson('/api/v1/membres/'.$membre->json('idMembre'), [
            'statutMembre' => 'en_attente',
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
        return Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => 'Kabila',
            'prenom' => 'Jean',
            'statut' => 'actif',
        ])->id_personne;
    }
}