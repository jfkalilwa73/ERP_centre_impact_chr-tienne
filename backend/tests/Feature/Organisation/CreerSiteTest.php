<?php

namespace Tests\Feature\Organisation;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreerSiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/organisation/sites', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Site Gombe',
            'telephone' => '+243810000002',
        ])->assertUnauthorized();
    }

    public function test_champs_obligatoires(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/organisation/sites', [])
            ->assertUnprocessable();
    }

    public function test_creer_un_site_reussit(): void
    {
        $this->seConnecter();

        $response = $this->postJson('/api/v1/organisation/sites', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Site Gombe',
            'telephone' => '+243810000002',
            'adresse' => 'Boulevard du 30 Juin, Gombe',
            'ville' => 'Kinshasa',
            'pays' => 'RDC',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'SITE-GOMBE-01')
            ->assertJsonPath('data.nom', 'Site Gombe')
            ->assertJsonPath('data.ville', 'Kinshasa')
            ->assertJsonPath('data.actif', true);

        $this->assertNotEmpty($response->json('data.id_site'));
        $this->assertDatabaseHas('site', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Site Gombe',
        ]);
    }

    public function test_code_deja_utilise_est_refuse(): void
    {
        $this->seConnecter();

        $this->postJson('/api/v1/organisation/sites', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Site Gombe',
            'telephone' => '+243810000002',
        ])->assertCreated();

        $this->postJson('/api/v1/organisation/sites', [
            'code' => 'SITE-GOMBE-01',
            'nom' => 'Autre site',
            'telephone' => '+243810000003',
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
}