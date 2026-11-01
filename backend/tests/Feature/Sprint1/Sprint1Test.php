<?php

namespace Tests\Feature\Sprint1;

use App\Models\FamilleImpact;
use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class Sprint1Test extends TestCase
{
    use RefreshDatabase;

    public function test_le_sprint_1_enregistre_membre_regroupement_et_presence(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $personne = $this->personne('KABILA', 'Jean');
        $proche = $this->personne('NGOY', 'Ruth');
        $famille = FamilleImpact::query()->create([
            'id_famille' => (string) Str::uuid(),
            'code' => 'BAT-TEST',
            'nom' => 'Bâtisseurs test',
            'actif' => true,
        ]);

        $membre = $this->postJson("/api/v1/personnes/{$personne->id_personne}/membre", [
            'dateIntegration' => '2026-01-15',
            'statutMembre' => 'en_attente',
        ])->assertCreated()
            ->assertJsonPath('statutMembre', 'en_attente');

        $this->assertMatchesRegularExpression('/^MEM-\d{4}-\d{4}$/', $membre->json('numeroMembre'));

        $this->patchJson('/api/v1/membres/'.$membre->json('idMembre'), [
            'statutMembre' => 'actif',
            'motif' => 'Intégration confirmée',
        ])->assertOk()->assertJsonPath('statutMembre', 'actif');

        $this->getJson('/api/v1/membres/'.$membre->json('idMembre').'/historique')
            ->assertOk()
            ->assertJsonPath('0.ancienStatut', 'en_attente')
            ->assertJsonPath('0.nouveauStatut', 'actif')
            ->assertJsonPath('0.motif', 'Intégration confirmée')
            ->assertJsonPath('0.changePar', $user->name);

        $this->patchJson("/api/v1/familles-impact/{$famille->id_famille}", [
            'responsableId' => $personne->id_personne,
            'adjointId' => $proche->id_personne,
            'capaciteMax' => 12,
            'jourReunion' => 'mercredi',
            'heureReunion' => '18:30',
            'lieuReunion' => 'Salle nord',
        ])->assertOk()
            ->assertJsonPath('responsableId', $personne->id_personne)
            ->assertJsonPath('heureReunion', '18:30')
            ->assertJsonPath('lieuReunion', 'Salle nord');

        $regroupement = $this->postJson('/api/v1/regroupements', [
            'nomFamille' => 'Famille KABILA',
            'responsableLegalId' => $personne->id_personne,
        ])->assertCreated();

        $this->postJson('/api/v1/regroupements/'.$regroupement->json('idFamille').'/relations', [
            'idPersonne1' => $personne->id_personne,
            'idPersonne2' => $proche->id_personne,
            'typeRelation' => 'conjoint',
        ])->assertCreated();

        $this->getJson("/api/v1/personnes/{$proche->id_personne}/regroupement")
            ->assertOk()
            ->assertJsonPath('nomFamille', 'Famille KABILA')
            ->assertJsonPath('relations.0.typeRelation', 'conjoint');

        $this->postJson("/api/v1/personnes/{$personne->id_personne}/familles-impact", [
            'idFamille' => $famille->id_famille,
            'fonction' => 'Chef',
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

    private function personne(string $nom, string $prenom): Personne
    {
        return Personne::query()->create([
            'id_personne' => (string) Str::uuid(),
            'nom' => $nom,
            'prenom' => $prenom,
            'statut' => 'actif',
        ]);
    }
}
