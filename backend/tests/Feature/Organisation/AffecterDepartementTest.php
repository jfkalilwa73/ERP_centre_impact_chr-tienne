<?php

namespace Tests\Feature\Organisation;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AffecterDepartementTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/organisation/personnes/'.Str::uuid().'/departements', [
            'id_departement' => (string) Str::uuid(),
        ])->assertUnauthorized();
    }

    public function test_id_departement_est_obligatoire(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $this->postJson("/api/v1/organisation/personnes/{$idPersonne}/departements", [])
            ->assertUnprocessable();
    }

    public function test_personne_introuvable(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/organisation/personnes/'.Str::uuid().'/departements', [
            'id_departement' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_departement_introuvable(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();

        $this->postJson("/api/v1/organisation/personnes/{$idPersonne}/departements", [
            'id_departement' => (string) Str::uuid(),
        ])->assertNotFound();
    }

    public function test_affecter_une_personne_reussit(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();
        $idDepartement = $this->creerDepartement();

        $response = $this->postJson("/api/v1/organisation/personnes/{$idPersonne}/departements", [
            'id_departement' => $idDepartement,
            'fonction' => 'Responsable accueil',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.id_personne', $idPersonne)
            ->assertJsonPath('data.id_departement', $idDepartement)
            ->assertJsonPath('data.fonction', 'Responsable accueil')
            ->assertJsonPath('data.actif', true);

        $this->assertDatabaseHas('affecter_departement', [
            'id_personne' => $idPersonne,
            'id_departement' => $idDepartement,
            'actif' => true,
        ]);
    }

    public function test_affectation_deja_active_est_refusee(): void
    {
        $this->seConnecter();
        $idPersonne = $this->creerPersonne();
        $idDepartement = $this->creerDepartement();

        $this->postJson("/api/v1/organisation/personnes/{$idPersonne}/departements", [
            'id_departement' => $idDepartement,
        ])->assertCreated();

        $this->postJson("/api/v1/organisation/personnes/{$idPersonne}/departements", [
            'id_departement' => $idDepartement,
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
        $response = $this->postJson('/api/v1/identite/personnes', [
            'nom' => 'Karagi',
            'prenom' => 'Bienvenu',
        ])->assertCreated();

        return $response->json('data.id_personne');
    }

    private function creerDepartement(): string
    {
        $site = $this->postJson('/api/v1/organisation/sites', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Site Gombe',
            'telephone' => '+243810000002',
        ])->assertCreated();

        $departement = $this->postJson('/api/v1/organisation/departements', [
            'code' => 'DEPT-ACCUEIL',
            'nom' => 'Département Accueil',
            'id_site' => $site->json('data.id_site'),
        ])->assertCreated();

        return $departement->json('data.id_departement');
    }
}