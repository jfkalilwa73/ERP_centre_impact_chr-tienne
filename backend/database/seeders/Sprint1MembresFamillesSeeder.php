<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Personne;
use App\Models\Membre;
use App\Models\Famille;
use App\Models\RelationFamiliale;
use App\Models\FamilleImpact;
use App\Models\AffecterFamilleImpact;
use App\Models\PresenceFamilleImpact;
use App\Models\HistoriqueStatutMembre;
use App\Models\Site;
use Carbon\Carbon;

class Sprint1MembresFamillesSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("🚀 DÉBUT DU SEEDER SPRINT 1 — MEMBRES & FAMILLES (Contexte UPN / Kinshasa)");
        $this->command->newLine();

        // ---------------------------------------------------------
        // Références Phase 0 (déjà en base)
        // ---------------------------------------------------------
        $adminUser = User::where('email', 'jean.nuru@eglise-upn.org')->first();
        $adminUserId = $adminUser ? $adminUser->id : User::first()->id;
        $sitePrincipal = Site::where('code', 'SITE-UPN-01')->first();

        // ---------------------------------------------------------
        // 1. Création des personnes (identités physiques)
        // ---------------------------------------------------------
        $this->command->info("1. Création des personnes et membres...");

        $noms = [
            'Nuru', 'Mbuyi', 'Kanda', 'Tshimanga', 'Lubaki', 'Mpiana', 'Kabasele', 'Nlandu',
            'Tshibala', 'Mulumba', 'Kasongo', 'Mwene', 'Ilunga', 'Katenda', 'Banza', 'Diaw',
            'Nkulu', 'Tshomba', 'Madiata', 'Kitenge', 'Lukusa', 'Mpoyi', 'Nzinga', 'Mokeni',
            'Pindi', 'Tshiak', 'Bukasa', 'Mwamba', 'Kabeya', 'Kalala', 'Mudekereza', 'Nsiona',
            'Tshiala', 'Mukendi', 'Kalonda', 'Mayamba', 'Kabuya', 'Mbuyamba', 'Kalonji',
            'Nkashama', 'Tshibuyi', 'Mbaya', 'Kibambe', 'Lwamba', 'Ntumba', 'Mwenze', 'Kamba',
            'Tshisenge', 'Bompunga', 'Mbwebwe', 'Katshitshi', 'Nkongolo', 'Mamba', 'Ndala',
            'Mvula', 'Nsibu', 'Kazadi', 'Mpande', 'Lusamba', 'Mokili', 'Mwamba', 'Tshitenge',
        ];

        $prenoms = [
            'Jean', 'Marie', 'Pierre', 'Grace', 'David', 'Esther', 'Samuel', 'Ruth',
            'Joseph', 'Sarah', 'Elizabeth', 'Michel', 'Catherine', 'Paul', 'Anne', 'Thomas',
            'Martine', 'Robert', 'Brigitte', 'Daniel', 'Françoise', 'André', 'Monique',
            'Jean-Pierre', 'Colette', 'Philippe', 'Hélène', 'Nicolas', 'Sandra', 'Éric',
            'Nathalie', 'Laurent', 'Véronique', 'Stéphane', 'Patricia', 'Olivier', 'Corinne',
            'Patrick', 'Isabelle', 'Sébastien', 'Valérie', 'Christophe', 'Sylvie', 'François',
            'Nadine', 'Matthieu', 'Karine', 'Julien', 'Émilie', 'Alexandre', 'Manon',
            'Baptiste', 'Lucie', 'Hugo', 'Léa', 'Clara', 'Louis', 'Jade', 'Arthur', 'Emma',
            'Gabriel', 'Alice', 'Lucas', 'Léna', 'Théo', 'Chloé', 'Enzo', 'Mila', 'Liam',
            'Anna', 'Noé', 'Rose',
        ];

        $sexes = ['M', 'F'];
        $communes = ['Mont-Ngafula', 'Lemba', 'Ngaliema', 'Kalamu', 'Kimbanseke', 'Nsele', 'Masina', 'Ndjili'];

        $nombreMembres = 65;
        $personnesCrees = [];
        $membresCrees = [];

        for ($i = 0; $i < $nombreMembres; $i++) {
            $nom = $noms[array_rand($noms)];
            $prenom = $prenoms[array_rand($prenoms)];
            $sexe = $sexes[array_rand($sexes)];
            $anneeNaissance = rand(1965, 2005);
            $moisNaissance = rand(1, 12);
            $jourNaissance = rand(1, 28);
            $dateNaissance = sprintf('%04d-%02d-%02d', $anneeNaissance, $moisNaissance, $jourNaissance);
            $commune = $communes[array_rand($communes)];
            $telephone = '+243' . rand(810000000, 999999999);

            $personneId = (string) Str::uuid();
            $personne = Personne::create([
                'id_personne' => $personneId,
                'nom' => $nom,
                'prenom' => $prenom,
                'date_naissance' => $dateNaissance,
                'sexe' => $sexe,
                'telephone' => $telephone,
                'adresse' => 'Avenue ' . rand(1, 150) . ', Quartier ' . strtolower($commune) . ', Commune de ' . $commune . ', Kinshasa',
                'statut' => 'actif',
            ]);

            // Année d'intégration entre 2020 et 2026
            $anneeIntegration = rand(2020, 2026);
            $moisIntegration = rand(1, 12);
            $jourIntegration = rand(1, 28);
            $dateIntegration = sprintf('%04d-%02d-%02d', $anneeIntegration, $moisIntegration, $jourIntegration);

            // Répartition des statuts : 70% actif, 20% inactif, 10% en_attente
            $randStatut = rand(1, 100);
            if ($randStatut <= 70) {
                $statutMembre = 'actif';
            } elseif ($randStatut <= 90) {
                $statutMembre = 'inactif';
            } else {
                $statutMembre = 'en_attente';
            }

            $membreId = (string) Str::uuid();
            // numero_membre non fourni → généré automatiquement par le trigger trg_numero_membre_auto
            $membre = Membre::create([
                'id_membre' => $membreId,
                'id_personne' => $personneId,
                'date_integration' => $dateIntegration,
                'statut_membre' => $statutMembre,
                'date_changement_statut' => now(),
                'motif_changement_statut' => 'Intégration initiale',
                'famille_impact_id' => null, // affecté après création des familles d'impact
            ]);

            $personnesCrees[] = ['id' => $personneId, 'nom' => $nom, 'prenom' => $prenom, 'sexe' => $sexe];
            $membresCrees[] = [
                'id' => $membreId,
                'id_personne' => $personneId,
                'nom' => $nom,
                'prenom' => $prenom,
                'sexe' => $sexe,
                'statut' => $statutMembre,
            ];
        }

        $this->command->info("   ✅ {$nombreMembres} personnes et membres créés.");

        // ---------------------------------------------------------
        // 2. Création des familles (20-30)
        // ---------------------------------------------------------
        $this->command->info("2. Création des familles...");
        $nombreFamilles = 25;
        $famillesCrees = [];

        $nomsFamille = [
            'Famille Nuru', 'Famille Mbuyi', 'Famille Kanda', 'Famille Tshimanga',
            'Famille Lubaki', 'Famille Mpiana', 'Famille Kabasele', 'Famille Nlandu',
            'Famille Tshibala', 'Famille Mulumba', 'Famille Kasongo', 'Famille Mwene',
            'Famille Ilunga', 'Famille Katenda', 'Famille Banza', 'Famille Diaw',
            'Famille Nkulu', 'Famille Tshomba', 'Famille Madiata', 'Famille Kitenge',
            'Famille Lukusa', 'Famille Mpoyi', 'Famille Nzinga', 'Famille Mokeni',
            'Famille Pindi', 'Famille Bukasa', 'Famille Mwamba', 'Famille Kabeya',
            'Famille Kalala', 'Famille Mudekereza', 'Famille Nsiona', 'Famille Tshiala',
            'Famille Mukendi', 'Famille Kalonda', 'Famille Mayamba', 'Famille Kabuya',
            'Famille Mbuyamba', 'Famille Kalonji', 'Famille Nkashama', 'Famille Tshibuyi',
            'Famille Mbaya', 'Famille Kibambe', 'Famille Lwamba', 'Famille Ntumba',
        ];

        for ($i = 0; $i < $nombreFamilles; $i++) {
            $nomFamille = $nomsFamille[$i] ?? 'Famille ' . $noms[array_rand($noms)];
            $familleId = (string) Str::uuid();

            // Responsable légal : une personne parmi celles créées
            $responsableIndex = rand(0, count($personnesCrees) - 1);
            $responsable = $personnesCrees[$responsableIndex];

            $famille = Famille::create([
                'id_famille' => $familleId,
                'nom_famille' => $nomFamille,
                'adresse' => 'Avenue ' . rand(1, 200) . ', Commune de ' . $communes[array_rand($communes)] . ', Kinshasa',
                'telephone_principal' => '+243' . rand(810000000, 999999999),
                'responsable_legal_id' => $responsable['id'],
            ]);

            $famillesCrees[] = [
                'id' => $familleId,
                'nom' => $nomFamille,
                'responsable_id' => $responsable['id'],
            ];
        }

        $this->command->info("   ✅ {$nombreFamilles} familles créées.");

        // ---------------------------------------------------------
        // 3. Relations familiales (conjoints, parents-enfants, tuteurs)
        // ---------------------------------------------------------
        $this->command->info("3. Création des relations familiales...");
        $nombreRelations = 0;

        foreach ($famillesCrees as $famille) {
            // Chaque famille : 1 responsable + conjoint éventuel + 1 à 3 enfants
            $membresFamille = array_filter($membresCrees, function ($m) use ($famille) {
                return $m['id_personne'] === $famille['responsable_id'];
            });

            // Conjoint : une autre personne du même sexe opposé
            $sexeResponsable = array_values(array_filter($personnesCrees, function ($p) use ($famille) {
                return $p['id'] === $famille['responsable_id'];
            }))[0]['sexe'] ?? 'M';
            $sexeConjoint = $sexeResponsable === 'M' ? 'F' : 'M';

            $candidatsConjoint = array_values(array_filter($personnesCrees, function ($p) use ($sexeConjoint, $famille) {
                return $p['sexe'] === $sexeConjoint && $p['id'] !== $famille['responsable_id'];
            }));

            if (!empty($candidatsConjoint) && rand(1, 100) <= 80) {
                $conjoint = $candidatsConjoint[array_rand($candidatsConjoint)];
                RelationFamiliale::create([
                    'id_relation' => (string) Str::uuid(),
                    'id_famille' => $famille['id'],
                    'id_personne_1' => $famille['responsable_id'],
                    'id_personne_2' => $conjoint['id'],
                    'type_relation' => 'conjoint',
                    'date_debut' => now()->subYears(rand(1, 25)),
                    'date_fin' => null,
                    'actif' => true,
                ]);
                $nombreRelations++;
            }

            // Enfants : 1 à 3
            $nbEnfants = rand(1, 3);
            for ($e = 0; $e < $nbEnfants; $e++) {
                $candidatsEnfant = array_values(array_filter($personnesCrees, function ($p) use ($famille) {
                    return $p['id'] !== $famille['responsable_id'];
                }));
                if (empty($candidatsEnfant)) {
                    continue;
                }
                $enfant = $candidatsEnfant[array_rand($candidatsEnfant)];
                RelationFamiliale::create([
                    'id_relation' => (string) Str::uuid(),
                    'id_famille' => $famille['id'],
                    'id_personne_1' => $famille['responsable_id'],
                    'id_personne_2' => $enfant['id'],
                    'type_relation' => 'parent',
                    'date_debut' => now()->subYears(rand(1, 20)),
                    'date_fin' => null,
                    'actif' => true,
                ]);
                $nombreRelations++;
            }
        }

        $this->command->info("   ✅ {$nombreRelations} relations familiales créées.");

        // ---------------------------------------------------------
        // 4. Familles d'impact (5-8) avec colonnes étendues
        // ---------------------------------------------------------
        $this->command->info("4. Création des familles d'impact...");
        $famillesImpact = [
            [
                'code' => 'FI-UPN-01',
                'nom' => 'Famille d\'Impact UPN Centre',
                'zone' => 'Zone UPN',
                'responsable_id' => null,
                'adjoint_id' => null,
                'capacite_max' => 40,
                'jour_reunion' => 'Mardi',
                'heure_reunion' => '18:00:00',
                'lieu_reunion' => 'Salle principale, Campus Principal (Mont-Ngafula)',
            ],
            [
                'code' => 'FI-LEMBA-02',
                'nom' => 'Famille d\'Impact Lemba Nord',
                'zone' => 'Zone Lemba',
                'responsable_id' => null,
                'adjoint_id' => null,
                'capacite_max' => 35,
                'jour_reunion' => 'Jeudi',
                'heure_reunion' => '17:30:00',
                'lieu_reunion' => 'Centre communautaire, Avenue de l\'Université',
            ],
            [
                'code' => 'FI-NGALIEMA-03',
                'nom' => 'Famille d\'Impact Ngaliema Ouest',
                'zone' => 'Zone Ngaliema',
                'responsable_id' => null,
                'adjoint_id' => null,
                'capacite_max' => 30,
                'jour_reunion' => 'Samedi',
                'heure_reunion' => '16:00:00',
                'lieu_reunion' => 'Église annexe, Boulevard du 30 Juin',
            ],
            [
                'code' => 'FI-KALAMU-04',
                'nom' => 'Famille d\'Impact Kalamu Est',
                'zone' => 'Zone Kalamu',
                'responsable_id' => null,
                'adjoint_id' => null,
                'capacite_max' => 25,
                'jour_reunion' => 'Dimanche',
                'heure_reunion' => '09:00:00',
                'lieu_reunion' => 'Salle paroissiale, Kalamu',
            ],
            [
                'code' => 'FI-KIMBANSEKE-05',
                'nom' => 'Famille d\'Impact Kimbanseke Sud',
                'zone' => 'Zone Kimbanseke',
                'responsable_id' => null,
                'adjoint_id' => null,
                'capacite_max' => 45,
                'jour_reunion' => 'Mercredi',
                'heure_reunion' => '18:30:00',
                'lieu_reunion' => 'Centre de jeunesse, Kimbanseke',
            ],
            [
                'code' => 'FI-NSELE-06',
                'nom' => 'Famille d\'Impact Nsele Rural',
                'zone' => 'Zone Nsele',
                'responsable_id' => null,
                'adjoint_id' => null,
                'capacite_max' => 20,
                'jour_reunion' => 'Vendredi',
                'heure_reunion' => '17:00:00',
                'lieu_reunion' => 'Salle communautaire, Nsele',
            ],
        ];

        $famillesImpactCrees = [];

        foreach ($famillesImpact as $index => $fi) {
            // Responsable : un membre actif parmi ceux créés
            $membresActifs = array_values(array_filter($membresCrees, function ($m) {
                return $m['statut'] === 'actif';
            }));
            $responsable = $membresActifs[array_rand($membresActifs)] ?? null;
            $responsableId = $responsable ? $responsable['id_personne'] : null;

            // Adjoint : une autre personne
            $adjoint = null;
            $autresPersonnes = array_values(array_filter($personnesCrees, function ($p) use ($responsableId) {
                return $p['id'] !== $responsableId;
            }));
            if (!empty($autresPersonnes) && rand(1, 100) <= 70) {
                $adjoint = $autresPersonnes[array_rand($autresPersonnes)];
            }

            $familleImpact = FamilleImpact::create([
                'id_famille' => (string) Str::uuid(),
                'code' => $fi['code'],
                'nom' => $fi['nom'],
                'zone' => $fi['zone'],
                'description' => 'Famille d\'impact communautaire — ' . $fi['zone'],
                'responsable_id' => $responsableId,
                'adjoint_id' => $adjoint ? $adjoint['id'] : null,
                'capacite_max' => $fi['capacite_max'],
                'jour_reunion' => $fi['jour_reunion'],
                'heure_reunion' => $fi['heure_reunion'],
                'lieu_reunion' => $fi['lieu_reunion'],
                'actif' => true,
            ]);

            $famillesImpactCrees[] = [
                'id' => $familleImpact->id_famille,
                'nom' => $fi['nom'],
                'zone' => $fi['zone'],
                'responsable_id' => $responsableId,
            ];
        }

        $this->command->info("   ✅ " . count($famillesImpactCrees) . " familles d'impact créées.");

        // ---------------------------------------------------------
        // 5. Affectation des membres aux familles d'impact
        // ---------------------------------------------------------
        $this->command->info("5. Affectation des membres aux familles d'impact...");
        $nombreAffectations = 0;

        foreach ($membresCrees as $index => $membre) {
            // Chaque membre a 60% de chance d'être affecté à une famille d'impact
            if (rand(1, 100) > 60) {
                continue;
            }
            $familleImpact = $famillesImpactCrees[array_rand($famillesImpactCrees)];
            $dateDebut = Carbon::parse($membre['date_integration'] ?? now())->format('Y-m-d');

            AffecterFamilleImpact::create([
                'id_affectation' => (string) Str::uuid(),
                'id_membre' => $membre['id'],
                'id_famille_impact' => $familleImpact['id'],
                'date_debut' => $dateDebut,
                'date_fin' => null,
                'actif' => true,
                'motif_fin' => null,
            ]);
            $nombreAffectations++;

            // Mise à jour du membre avec sa famille_impact_id (dernière affectation)
            Membre::where('id_membre', $membre['id'])->update([
                'famille_impact_id' => $familleImpact['id'],
            ]);
        }

        $this->command->info("   ✅ {$nombreAffectations} affectations aux familles d'impact créées.");

        // ---------------------------------------------------------
        // 6. Présences aux réunions (reporting)
        // ---------------------------------------------------------
        $this->command->info("6. Enregistrement des présences aux réunions...");
        $nombrePresences = 0;

        $affectationsActives = AffecterFamilleImpact::where('actif', true)->get();

        foreach ($affectationsActives as $affectation) {
            // 3 à 8 réunions par affectation
            $nbReunions = rand(3, 8);
            for ($r = 0; $r < $nbReunions; $r++) {
                $dateReunion = now()->subDays(rand(1, 180))->format('Y-m-d');
                $present = rand(1, 100) <= 75; // 75% de présence

                PresenceFamilleImpact::create([
                    'id_presence' => (string) Str::uuid(),
                    'id_affectation' => $affectation->id_affectation,
                    'date_reunion' => $dateReunion,
                    'present' => $present,
                    'commentaire' => $present ? null : 'Absent justifié',
                    'enregistre_par' => $adminUserId,
                ]);
                $nombrePresences++;
            }
        }

        $this->command->info("   ✅ {$nombrePresences} présences enregistrées.");

        // ---------------------------------------------------------
        // 7. Changements de statut membres (test historique)
        // ---------------------------------------------------------
        $this->command->info("7. Changements de statut membres (test historique)...");
        $nombreChangements = 0;

        // Sélectionner 12 membres actifs pour simuler des changements de statut
        $membresPourChangement = array_slice(
            array_values(array_filter($membresCrees, function ($m) {
                return $m['statut'] === 'actif';
            })),
            0,
            12
        );

        foreach ($membresPourChangement as $index => $membre) {
            $nouveauStatut = $index % 3 === 0 ? 'inactif' : ($index % 3 === 1 ? 'en_attente' : 'archive');

            $membreModel = Membre::where('id_membre', $membre['id'])->first();
            if (!$membreModel) {
                continue;
            }

            $ancienStatut = $membreModel->statut_membre;
            $membreModel->update([
                'statut_membre' => $nouveauStatut,
                'date_changement_statut' => now(),
                'motif_changement_statut' => 'Changement de statut simulé — test Sprint 1',
            ]);

            // L'entrée d'historique est créée automatiquement par le trigger trg_historique_statut_membre
            $nombreChangements++;
        }

        $this->command->info("   ✅ {$nombreChangements} changements de statut simulés (historisation automatique).");

        // ---------------------------------------------------------
        // Récapitulatif
        // ---------------------------------------------------------
        $this->command->newLine();
        $this->command->info("🏁 FIN DU SEEDER SPRINT 1 — MEMBRES & FAMILLES");
        $this->command->info("   • Personnes : {$nombreMembres}");
        $this->command->info("   • Membres : {$nombreMembres}");
        $this->command->info("   • Familles : {$nombreFamilles}");
        $this->command->info("   • Relations familiales : {$nombreRelations}");
        $this->command->info("   • Familles d'impact : " . count($famillesImpactCrees));
        $this->command->info("   • Affectations familles d'impact : {$nombreAffectations}");
        $this->command->info("   • Présences : {$nombrePresences}");
        $this->command->info("   • Changements de statut : {$nombreChangements}");
        $this->command->info("   ✅ Tout est opérationnel !");
    }
}
