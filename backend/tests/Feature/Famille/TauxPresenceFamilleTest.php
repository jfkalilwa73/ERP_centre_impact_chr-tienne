<?php

namespace Tests\Feature\Famille;

use App\Models\FamilleImpact;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TauxPresenceFamilleTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculer_le_taux_de_presence(): void
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
            'code' => 'BAT-TAUX',
            'nom' => 'Bâtisseurs taux',
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

        $affectationId = $this->postJson("/api/v1/familles-impact/{$famille->id_famille}/suivi")
            ->assertOk()
            ->json('affectations.0.idAffectation');

        $this->putJson("/api/v1/familles-impact/{$famille->id_famille}/presences", [
            'dateReunion' => '2026-10-15',
            'lignes' => [
                ['idAffectation' => $affectationId, 'present' => true],
            ],
        ])->assertOk();

        $this->putJson("/api/v1/familles-impact/{$famille->id_famille}/presences", [
            'dateReunion' => '2026-10-22',
            'lignes' => [
                ['idAffectation' => $affectationId, 'present' => false],
            ],
        ])->assertOk();

        $this->getJson("/api/v1/familles-impact/{$famille->id_famille}/presences")
            ->assertOk()
            ->assertJsonPath('tauxParticipation.totalReunions', 2)
            ->assertJsonPath('tauxParticipation.presences', 1)
            ->assertJsonPath('tauxParticipation.taux', 50)
            ->assertJsonPath('tauxParMembre.0.presents', 1)
            ->assertJsonPath('tauxParMembre.0.convocations', 2)
            ->assertJsonPath('tauxParMembre.0.taux', 50);
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