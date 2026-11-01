<?php

namespace Tests\Feature\Identite;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SupprimerPersonneTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->deleteJson('/api/v1/identite/personnes/'.Str::uuid())
            ->assertUnauthorized();
    }

    public function test_personne_introuvable(): void
    {
        $this->seConnecter();

        $this->deleteJson('/api/v1/identite/personnes/'.Str::uuid())
            ->assertNotFound();
    }

    public function test_personne_active_est_refusee(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $this->deleteJson("/api/v1/identite/personnes/{$idPersonne}")
            ->assertStatus(409);

        $this->assertDatabaseHas('personne', [
            'id_personne' => $idPersonne,
            'statut' => 'actif',
        ]);
    }

    public function test_personne_inactive_peut_etre_supprimee(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $personne = Personne::query()->findOrFail($idPersonne);
        $personne->statut = 'inactif';
        $personne->save();

        $this->deleteJson("/api/v1/identite/personnes/{$idPersonne}")
            ->assertNoContent();

        $this->assertDatabaseMissing('personne', [
            'id_personne' => $idPersonne,
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
        $response = $this->postJson('/api/v1/identite/personnes', [
            'nom' => 'Test',
            'prenom' => 'Trigger',
        ])->assertCreated();

        return $response->json('data.id_personne');
    }
}