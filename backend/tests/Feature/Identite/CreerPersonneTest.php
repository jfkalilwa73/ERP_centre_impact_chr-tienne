<?php

namespace Tests\Feature\Identite;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreerPersonneTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/identite/personnes', [
            'nom' => 'Nuru',
            'prenom' => 'Jean',
        ])->assertUnauthorized();
    }

    public function test_nom_et_prenom_sont_obligatoires(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $this->postJson('/api/v1/identite/personnes', [])
            ->assertUnprocessable();
    }

    public function test_creer_une_personne_reussit(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $response = $this->postJson('/api/v1/identite/personnes', [
            'nom' => 'Nuru',
            'prenom' => 'Jean',
            'date_naissance' => '1990-05-15',
            'sexe' => 'M',
            'telephone' => '+243819999999',
            'adresse' => 'Mont-Ngafula, Kinshasa',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.nom', 'Nuru')
            ->assertJsonPath('data.prenom', 'Jean')
            ->assertJsonPath('data.statut', 'actif')
            ->assertJsonPath('data.user_id', null);

        $this->assertNotEmpty($response->json('data.id_personne'));
    }
}