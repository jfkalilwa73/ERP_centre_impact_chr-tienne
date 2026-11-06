<?php

namespace Tests\Feature\Famille;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreerRegroupementTest extends TestCase
{
    use RefreshDatabase;

    public function test_sans_session_est_refuse(): void
    {
        $this->postJson('/api/v1/regroupements', [
            'nomFamille' => 'Famille Test',
        ])->assertUnauthorized();
    }

    public function test_personne_sans_regroupement(): void
    {
        $this->seConnecter();
        $id = $this->personne('Kabila', 'Jean');

        $this->getJson("/api/v1/personnes/{$id}/regroupement")->assertNotFound();
    }

    public function test_creer_un_regroupement_et_une_relation(): void
    {
        $this->seConnecter();
        $a = $this->personne('Kabila', 'Jean');
        $b = $this->personne('Ngoy', 'Ruth');

        $famille = $this->postJson('/api/v1/regroupements', [
            'nomFamille' => 'Famille Kabila',
            'responsableLegalId' => $a,
        ])->assertCreated()
            ->assertJsonPath('nomFamille', 'Famille Kabila');

        $this->postJson('/api/v1/regroupements/'.$famille->json('idFamille').'/relations', [
            'idPersonne1' => $a,
            'idPersonne2' => $b,
            'typeRelation' => 'conjoint',
        ])->assertCreated();

        $this->getJson("/api/v1/personnes/{$b}/regroupement")
            ->assertOk()
            ->assertJsonPath('nomFamille', 'Famille Kabila')
            ->assertJsonPath('relations.0.typeRelation', 'conjoint');
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