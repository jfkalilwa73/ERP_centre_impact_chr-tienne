<?php

namespace Tests\Feature\Identite;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreerCompteTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/identite/comptes', [
            'id_personne' => (string) Str::uuid(),
            'email' => 'bienvenu.karagi@eglise-upn.org',
            'password' => 'Secret123!',
        ])->assertUnauthorized();
    }

    public function test_champs_obligatoires(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/identite/comptes', [])
            ->assertUnprocessable();
    }

    public function test_personne_introuvable(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/identite/comptes', [
            'id_personne' => (string) Str::uuid(),
            'email' => 'inconnu@eglise-upn.org',
            'password' => 'Secret123!',
        ])->assertNotFound();
    }

    public function test_creer_un_compte_reussit(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonneSansCompte();

        $response = $this->postJson('/api/v1/identite/comptes', [
            'id_personne' => $idPersonne,
            'email' => 'bienvenu.karagi@eglise-upn.org',
            'password' => 'Secret123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'bienvenu.karagi@eglise-upn.org')
            ->assertJsonPath('data.id_personne', $idPersonne)
            ->assertJsonPath('data.statut', 'actif')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('password');

        $this->assertNotEmpty($response->json('data.id'));
        $this->assertDatabaseHas('personne', [
            'id_personne' => $idPersonne,
            'user_id' => $response->json('data.id'),
        ]);
    }

    public function test_personne_deja_liee_est_refusee(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonneSansCompte();

        $this->postJson('/api/v1/identite/comptes', [
            'id_personne' => $idPersonne,
            'email' => 'premier@eglise-upn.org',
            'password' => 'Secret123!',
        ])->assertCreated();

        $this->postJson('/api/v1/identite/comptes', [
            'id_personne' => $idPersonne,
            'email' => 'second@eglise-upn.org',
            'password' => 'Secret123!',
        ])->assertStatus(409);
    }

    public function test_email_deja_utilise_est_refuse(): void
    {
        $admin = $this->seConnecter();
        $idPersonne = $this->creerPersonneSansCompte();

        $this->postJson('/api/v1/identite/comptes', [
            'id_personne' => $idPersonne,
            'email' => $admin->email,
            'password' => 'Secret123!',
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

    private function creerPersonneSansCompte(): string
    {
        $response = $this->postJson('/api/v1/identite/personnes', [
            'nom' => 'Karagi',
            'prenom' => 'Bienvenu',
        ])->assertCreated();

        return $response->json('data.id_personne');
    }
}