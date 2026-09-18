<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\QueryException;
use App\Models\User;
use App\Models\Personne;
use App\Models\RoleMetier;
use App\Models\PermissionMetier;
use App\Models\AffecterRoleMetier;
use App\Models\AttribuerPermission;
use App\Models\Site;
use App\Models\Departement;
use App\Models\AffecterDepartement;
use App\Models\AuditLog;

class Phase0ScenarioSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("🚀 DÉBUT DU TEST DES SCÉNARIOS PHASE 0 (Contexte UPN / Kinshasa)");
        $this->command->newLine();

        // ---------------------------------------------------------
        // Scénario 1 & 2 : Créer une personne + Créer un compte de connexion
        // ---------------------------------------------------------
        $this->command->info("1. Création d'une Personne et d'un Compte (User)...");
        
        $personne = Personne::create([
            'nom' => 'Nuru',
            'prenom' => 'Jean',
            'date_naissance' => '1990-05-15',
            'sexe' => 'M',
            'telephone' => '+243819999999', // Préfixe Kinshasa (Airtel/Vodacom)
            'adresse' => 'Avenue 12, Quartier UPN, Commune de Mont-Ngafula, Kinshasa',
            'statut' => 'actif', 
        ]);

        $user = User::create([
            'name' => 'Jean Nuru',
            'email' => 'jean.nuru@eglise-upn.org',
            'password' => Hash::make('Secret123!'),
            'mfa_active' => false,
            'statut' => 'actif',
        ]);

        // Liaison Personne <-> Compte (User)
        $personne->user_id = $user->id;
        $personne->save();

        $this->command->info("   ✅ Personne (ID: {$personne->id_personne}) et Compte (ID: {$user->id}) créés et liés.");

        // ---------------------------------------------------------
        // Scénario 3 & 4 : Créer un rôle + Créer une permission
        // ---------------------------------------------------------
        $this->command->info("2. Création d'un Rôle et d'une Permission...");

        $role = RoleMetier::create([
            'code' => 'ADMIN_FONCTIONNEL',
            'nom' => 'Administrateur Fonctionnel',
            'description' => 'Gestion globale de l\'ERP',
            'niveau_confidentialite' => 3,
            'actif' => true,
        ]);

        $permission = PermissionMetier::create([
            'code' => 'membres.read',
            'module' => 'membres',
            'action' => 'read',
            'description' => 'Consulter la liste des membres',
            'actif' => true,
        ]);

        $this->command->info("   ✅ Rôle ({$role->code}) et Permission ({$permission->code}) créés.");

        // ---------------------------------------------------------
        // Scénario 5 & 6 : Attribuer un rôle à un compte + Attribuer des permissions à un rôle
        // ---------------------------------------------------------
        $this->command->info("3. Attribution du Rôle au Compte et de la Permission au Rôle...");

        AffecterRoleMetier::create([
            'user_id' => $user->id,
            'id_role' => $role->id_role,
            'date_debut' => now(),
            'actif' => true,
        ]);

        AttribuerPermission::create([
            'id_role' => $role->id_role,
            'id_permission' => $permission->id_permission,
        ]);

        $this->command->info("   ✅ Attribution réussie.");

        // ---------------------------------------------------------
        // Scénario 7 & 8 : Créer un site + Créer un département rattaché
        // ---------------------------------------------------------
        $this->command->info("4. Création d'un Site et d'un Département...");

        // Site Principal : Proche de l'UPN (Route de Matadi)
        $site = Site::create([
            'code' => 'SITE-UPN-01',
            'nom' => 'Campus Principal (Mont-Ngafula)',
            'adresse' => 'Route de Matadi, Km 28 (Proximité UPN), Mont-Ngafula',
            'ville' => 'Kinshasa',
            'pays' => 'RDC',
            'telephone' => '+243810000001', // Numéro d'accueil du site
            'actif' => true,
        ]);

        // (Optionnel) Second site pour tester le multi-site
        $site2 = Site::create([
            'code' => 'SITE-LEMBA-02',
            'nom' => 'Annexe Lemba',
            'adresse' => 'Avenue de l\'Université, Quartier Kimwenza',
            'ville' => 'Kinshasa',
            'pays' => 'RDC',
            'telephone' => '+243990000002',
            'actif' => true,
        ]);

        $departement = Departement::create([
            'code' => 'DEPT-FIN',
            'nom' => 'Département Finance',
            'mission' => 'Gestion des recettes, dîmes, offrandes et budgets institutionnels',
            'id_site' => $site->id_site, // Rattaché au site principal près de l'UPN
            'actif' => true,
        ]);

        $this->command->info("   ✅ Sites ({$site->nom} & {$site2->nom}) et Département ({$departement->nom}) créés.");

        // ---------------------------------------------------------
        // Scénario 9 : Affecter une personne à un département
        // ---------------------------------------------------------
        $this->command->info("5. Affectation de la Personne au Département...");

        AffecterDepartement::create([
            'id_personne' => $personne->id_personne,
            'id_departement' => $departement->id_departement,
            'fonction' => 'Responsable Départemental Finance',
            'date_debut' => now(),
            'actif' => true,
        ]);

        $this->command->info("   ✅ Affectation réussie (Fonction: Responsable Départemental Finance).");

        // ---------------------------------------------------------
        // Scénario 10 : Tracer une action (Audit Log)
        // ---------------------------------------------------------
        $this->command->info("6. Traçage d'une action dans l'Audit Log...");

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'SEEDER_TEST',
            'entite_type' => 'personne',
            'id_entite' => $personne->id_personne,
            'anciennes_valeurs' => null,
            'nouvelles_valeurs' => ['nom' => 'Nuru', 'statut' => 'actif', 'commune' => 'Mont-Ngafula'],
            'adresse_ip' => '192.168.1.15', // IP locale réaliste
            'user_agent' => 'Laravel Seeder CLI / Windows 11',
        ]);

        $this->command->info("   ✅ Action tracée dans audit_log.");

        // ---------------------------------------------------------
        // Scénario 11 : Vérifier qu'un compte a un droit
        // ---------------------------------------------------------
        $this->command->info("7. Vérification des droits du compte (Chaîne de relation)...");

        $hasRole = $user->rolesMetier()->where('code', 'ADMIN_FONCTIONNEL')->wherePivot('actif', true)->exists();
        $hasPermission = $role->permissions()->where('code', 'membres.read')->exists();

        if ($hasRole && $hasPermission) {
            $this->command->info("   ✅ SUCCÈS : Le compte possède bien la permission 'membres.read' via son rôle.");
        } else {
            $this->command->error("   ❌ ÉCHEC : La chaîne de permissions est rompue.");
        }

        // ---------------------------------------------------------
        // Scénario 12 : Empêcher la suppression d'une personne active (Test du Trigger)
        // ---------------------------------------------------------
        $this->command->info("8. Test du trigger de protection contre la suppression d'une personne active...");

        try {
            $personne->delete();
            $this->command->error("   ❌ ÉCHEC CRITIQUE : La personne active a été supprimée ! Le trigger ne fonctionne pas.");
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Impossible de supprimer une personne active')) {
                $this->command->info("   ✅ SUCCÈS : Le trigger a correctement bloqué la suppression.");
                $this->command->info("      Message DB : " . $e->getMessage());
            } else {
                $this->command->error("   ❌ ÉCHEC : Une autre erreur SQL est survenue : " . $e->getMessage());
            }
        }

        $this->command->newLine();
        $this->command->info("🏁 FIN DU TEST DES SCÉNARIOS PHASE 0. Tout est opérationnel !");
    }
}