<?php

namespace Tests\Feature\Famille;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListerRegroupementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->getJson('/api/v1/regroupements')->assertUnauthorized();
        $this->getJson('/api/v1/regroupements/'.Str::uuid())->assertUnauthorized();
    }

    public function test_liste_et_fiche_avec_relations(): void
    {
        $this->seConnecter();
        $a = $this->personne('Kabila', 'Jean');
        $b = $this->personne('Ngoy', 'Ruth');

        $famille = $this->postJson('/api/v1/regroupements', [
            'nomFamille' => 'Famille Kabila',
            'responsableLegalId' => $a,
        ])->assertCreated();

        $idFamille = $famille->json('idFamille');

        $this->postJson("/api/v1/regroupements/{$idFamille}/relations", [
            'idPersonne1' => $a,
            'idPersonne2' => $b,
            'typeRelation' => 'conjoint',
        ])->assertCreated();

        $this->postJson('/api/v1/regroupements', [
            'nomFamille' => 'Famille Autre',
        ])->assertCreated();

        $liste = $this->getJson('/api/v1/regroupements')->assertOk();
        $this->assertSame(2, $liste->json('pagination.total'));
        $this->assertCount(2, $liste->json('data'));

        $recherche = $this->getJson('/api/v1/regroupements?q=Kabila')->assertOk();
        $this->assertCount(1, $recherche->json('data'));
        $this->assertSame('Famille Kabila', $recherche->json('data.0.nomFamille'));

        $this->getJson("/api/v1/regroupements/{$idFamille}")
            ->assertOk()
            ->assertJsonPath('idFamille', $idFamille)
            ->assertJsonPath('nomFamille', 'Famille Kabila')
            ->assertJsonPath('relations.0.typeRelation', 'conjoint');
    }

    public function test_fiche_introuvable(): void
    {
        $this->seConnecter();

        $this->getJson('/api/v1/regroupements/'.Str::uuid())->assertNotFound();
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

    private function personne(string $nom, string $prenom): string
    {
        return Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => $nom,
            'prenom' => $prenom,
            'statut' => 'actif',
        ])->id_personne;
    }
}