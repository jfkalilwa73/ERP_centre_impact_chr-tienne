<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionCookieTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_reussit_sans_token(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.compte.email', $user->email)
            ->assertJsonPath('data.personne.prenom', explode(' ', $user->name)[0])
            ->assertJsonPath('data.permissions', [])
            ->assertJsonStructure([
                'data' => [
                    'compte' => ['idCompte', 'email', 'statut'],
                    'personne' => ['prenom', 'nom'],
                    'roles',
                    'permissions',
                ],
            ])
            ->assertJsonMissingPath('token')
            ->assertJsonMissingPath('data.token');
    }

    public function test_session_porte_la_personne_et_ignore_un_role_inactif(): void
    {
        $user = User::factory()->create(['name' => 'Administrateur']);
        $personne = \App\Models\Personne::query()->create([
            'id_personne' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'nom' => 'Compte',
            'prenom' => 'Admin',
            'statut' => 'actif',
        ]);

        $actif = \App\Models\RoleMetier::query()->create([
            'id_role' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'ACTIF_TEST',
            'nom' => 'Rôle actif',
            'actif' => true,
        ]);
        $inactif = \App\Models\RoleMetier::query()->create([
            'id_role' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'INACTIF_TEST',
            'nom' => 'Rôle inactif',
            'actif' => false,
        ]);
        $ouverte = \App\Models\PermissionMetier::query()->create([
            'id_permission' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'membres.read',
            'module' => 'membres',
            'action' => 'read',
            'description' => 'Lire',
            'actif' => true,
        ]);
        $fermee = \App\Models\PermissionMetier::query()->create([
            'id_permission' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'secret.read',
            'module' => 'secret',
            'action' => 'read',
            'description' => 'Secret',
            'actif' => true,
        ]);
        $actif->permissions()->attach($ouverte->id_permission);
        $inactif->permissions()->attach($fermee->id_permission);
        $user->rolesMetier()->attach($actif->id_role, ['actif' => true]);
        $user->rolesMetier()->attach($inactif->id_role, ['actif' => true]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.personne.idPersonne', $personne->id_personne)
            ->assertJsonPath('data.personne.nom', 'Compte')
            ->assertJsonPath('data.compte.idPersonne', $personne->id_personne);

        $roles = collect($response->json('data.roles'))->pluck('code');
        $this->assertTrue($roles->contains('ACTIF_TEST'));
        $this->assertFalse($roles->contains('INACTIF_TEST'));
        $this->assertSame(['membres.read'], $response->json('data.permissions'));
    }

    public function test_login_echoue_avec_mauvais_mot_de_passe(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong',
        ])->assertUnprocessable();
    }

    public function test_me_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_logout_detruit_la_session(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);

        $this->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/auth/me')->assertUnauthorized();    }
}