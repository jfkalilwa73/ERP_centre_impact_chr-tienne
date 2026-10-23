<?php

namespace Tests\Feature\Pilotage;

use App\Models\AffecterDepartement;
use App\Models\Departement;
use App\Models\PermissionMetier;
use App\Models\Personne;
use App\Models\RoleMetier;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PilotageTest extends TestCase
{
    use RefreshDatabase;

    public function test_pilotage_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/pilotage')->assertUnauthorized();
    }

    public function test_un_lecteur_sans_droit_est_refuse_et_un_large_enregistre(): void
    {
        $sansDroit = User::factory()->create();
        $this->postJson('/api/v1/auth/login', [
            'email' => $sansDroit->email,
            'password' => 'password',
        ])->assertOk();

        $this->getJson('/api/v1/pilotage')->assertForbidden();

        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();

        $large = $this->compte(['roles.manage']);
        $this->postJson('/api/v1/auth/login', [
            'email' => $large->email,
            'password' => 'password',
        ])->assertOk();

        $this->putJson('/api/v1/pilotage', [
            'activites' => [
                'dept-a' => [['id' => 'a1', 'titre' => 'Accueil']],
            ],
            'decisions' => [
                ['id' => 'd1', 'reference' => 'DGE-2026-04', 'idDepartement' => null],
            ],
        ])->assertOk()
            ->assertJsonPath('data.meta.seeded', true)
            ->assertJsonPath('data.activites.dept-a.0.titre', 'Accueil')
            ->assertJsonPath('data.decisions.0.reference', 'DGE-2026-04');
    }

    public function test_une_personne_limitee_ne_modifie_pas_les_autres_unites(): void
    {
        $site = Site::query()->create([
            'id_site' => (string) Str::uuid(),
            'code' => 'SITE-TEST',
            'nom' => 'Site test',
            'telephone' => '000',
            'actif' => true,
        ]);
        $deptA = Departement::query()->create([
            'id_departement' => (string) Str::uuid(),
            'code' => 'DEP-A',
            'nom' => 'Accueil',
            'id_site' => $site->id_site,
            'actif' => true,
        ]);
        $deptB = Departement::query()->create([
            'id_departement' => (string) Str::uuid(),
            'code' => 'DEP-B',
            'nom' => 'Louange',
            'id_site' => $site->id_site,
            'actif' => true,
        ]);

        $large = $this->compte(['roles.manage']);
        $this->postJson('/api/v1/auth/login', [
            'email' => $large->email,
            'password' => 'password',
        ])->assertOk();

        $this->putJson('/api/v1/pilotage', [
            'activites' => [
                $deptA->id_departement => [['id' => 'a1', 'titre' => 'Accueil']],
                $deptB->id_departement => [['id' => 'b1', 'titre' => 'Louange']],
            ],
            'projets' => [
                ['id' => 'pA', 'idDepartement' => $deptA->id_departement, 'titre' => 'Projet A'],
                ['id' => 'pB', 'idDepartement' => $deptB->id_departement, 'titre' => 'Projet B'],
            ],
            'decisions' => [
                ['id' => 'd1', 'reference' => 'DGE-2026-04'],
                ['id' => 'd2', 'reference' => 'SUP-2026-09', 'idDepartement' => $deptB->id_departement],
            ],
        ])->assertOk();

        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();

        $limite = $this->compte(['activites.read', 'activites.create']);
        $personne = Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'user_id' => $limite->id,
            'nom' => 'Mwamba',
            'prenom' => 'Pierre',
            'statut' => 'actif',
        ]);
        AffecterDepartement::query()->create([
            'id_personne' => $personne->id_personne,
            'id_departement' => $deptA->id_departement,
            'fonction' => 'Chef',
            'actif' => true,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $limite->email,
            'password' => 'password',
        ])->assertOk();

        $lecture = $this->getJson('/api/v1/pilotage')->assertOk();
        $activites = $lecture->json('data.activites');
        $this->assertArrayHasKey($deptA->id_departement, $activites);
        $this->assertArrayNotHasKey($deptB->id_departement, $activites);
        $this->assertSame(['DGE-2026-04'], collect($lecture->json('data.decisions'))->pluck('reference')->all());

        $this->putJson('/api/v1/pilotage', [
            'activites' => [
                $deptA->id_departement => [['id' => 'a1', 'titre' => 'Accueil modifié']],
                $deptB->id_departement => [['id' => 'b1', 'titre' => 'Piraté']],
            ],
            'projets' => [
                ['id' => 'pA', 'idDepartement' => $deptA->id_departement, 'titre' => 'Projet A modifié'],
                ['id' => 'pB', 'idDepartement' => $deptB->id_departement, 'titre' => 'Projet B piraté'],
            ],
        ])->assertOk();

        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/v1/auth/login', [
            'email' => $large->email,
            'password' => 'password',
        ])->assertOk();

        $final = $this->getJson('/api/v1/pilotage')->assertOk();
        $this->assertSame('Accueil modifié', $final->json('data.activites.'.$deptA->id_departement.'.0.titre'));
        $this->assertSame('Louange', $final->json('data.activites.'.$deptB->id_departement.'.0.titre'));
        $titres = collect($final->json('data.projets'))->pluck('titre', 'id');
        $this->assertSame('Projet A modifié', $titres['pA']);
        $this->assertSame('Projet B', $titres['pB']);
    }

    private function compte(array $codes): User
    {
        $user = User::factory()->create();
        $role = RoleMetier::query()->create([
            'id_role' => (string) Str::uuid(),
            'code' => 'ROLE_'.strtoupper(Str::random(6)),
            'nom' => 'Rôle test',
            'actif' => true,
        ]);

        foreach ($codes as $code) {
            [$module, $action] = explode('.', $code, 2);
            $permission = PermissionMetier::query()->create([
                'id_permission' => (string) Str::uuid(),
                'code' => $code,
                'module' => $module,
                'action' => $action,
                'description' => $code,
                'actif' => true,
            ]);
            $role->permissions()->attach($permission->id_permission);
        }

        $user->rolesMetier()->attach($role->id_role, ['actif' => true]);

        return $user;
    }
}
