<?php

namespace Tests\Feature\Famille;

use App\Models\FamilleImpact;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class EnregistrerPresencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_enregistrer_une_presence(): void
    {
        $this->seConnecter();
        $personne = Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => 'Kabila',
            'prenom' => 'Jean',
            'statut' => 'actif',
        ]);
        $famille = FamilleImpact::query()->create([
            'id_famille' => (string) Str::uuid(),
            'code' => 'BAT-TEST',
            'nom' => 'Bâtisseurs test',
            'actif' => true,
        ]);

        $this->postJson("/api/v1/personnes/{$personne->id_personne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'actif',
        ])->assertCreated();

        $this->postJson("/api/v1/personnes/{$personne->id_personne}/familles-impact", [
            'idFamille' => $famille->id_famille,
            'fonction' => 'Membre',
        ])->assertCreated();

        $feuille = $this->postJson("/api/v1/familles-impact/{$famille->id_famille}/suivi")->assertOk();
        $affectationId = $feuille->json('affectations.0.idAffectation');
        $this->assertNotEmpty($affectationId);

        $this->putJson("/api/v1/familles-impact/{$famille->id_famille}/presences", [
            'dateReunion' => '2026-10-22',
            'lignes' => [
                ['idAffectation' => $affectationId, 'present' => true, 'commentaire' => 'Présent'],
            ],
        ])->assertOk()
            ->assertJsonPath('presences.0.present', true)
            ->assertJsonPath('presences.0.dateReunion', '2026-10-22');
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