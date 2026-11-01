<?php

namespace Database\Seeders;

use App\Models\AffecterRoleMetier;
use App\Models\PermissionMetier;
use App\Models\RoleMetier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class Phase0ScenarioSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->firstOrNew(['email' => 'elieilunga007@gmail.com']);
        $user->name = 'Administrateur fonctionnel';
        $user->statut = 'actif';
        $user->mfa_active = false;
        if (! $user->exists) {
            $user->password = 'Secret123!';
        }
        $user->save();

        $role = RoleMetier::query()->firstOrNew(['code' => 'ADMIN_FONCTIONNEL']);
        if (! $role->exists) {
            $role->id_role = (string) Str::uuid();
        }
        $role->nom = 'Administrateur fonctionnel';
        $role->description = 'Configure le fonctionnement de l’ERP, y compris les réglages techniques. Sans notes pastorales ni salaires.';
        $role->niveau_confidentialite = 3;
        $role->actif = true;
        $role->save();

        $ids = [];
        foreach ($this->droits() as [$code, $module, $action, $description]) {
            $permission = PermissionMetier::query()->firstOrNew(['code' => $code]);
            if (! $permission->exists) {
                $permission->id_permission = (string) Str::uuid();
            }
            $permission->module = $module;
            $permission->action = $action;
            $permission->description = $description;
            $permission->actif = true;
            $permission->save();
            $ids[] = $permission->id_permission;
        }

        $role->permissions()->sync($ids);

        $deja = AffecterRoleMetier::query()
            ->where('user_id', $user->id)
            ->where('id_role', $role->id_role)
            ->where('actif', true)
            ->exists();

        if (! $deja) {
            AffecterRoleMetier::query()->create([
                'user_id' => $user->id,
                'id_role' => $role->id_role,
                'date_debut' => now(),
                'actif' => true,
            ]);
        }
    }

    /**
     * Droits de l’administrateur fonctionnel.
     * Hors périmètre : notes pastorales, salaires.
     *
     * @return list<array{0: string, 1: string, 2: string, 3: string}>
     */
    private function droits(): array
    {
        return [
            ['membres.read', 'membres', 'read', 'Consulter les personnes'],
            ['membres.create', 'membres', 'create', 'Créer une personne'],
            ['membres.update', 'membres', 'update', 'Modifier une personne'],
            ['membres.delete', 'membres', 'delete', 'Supprimer une personne inactive'],
            ['comptes.read', 'comptes', 'read', 'Consulter les comptes'],
            ['comptes.create', 'comptes', 'create', 'Créer un compte'],
            ['comptes.update', 'comptes', 'update', 'Modifier un compte'],
            ['comptes.delete', 'comptes', 'delete', 'Supprimer un compte non actif'],
            ['sites.read', 'sites', 'read', 'Consulter les sites'],
            ['sites.create', 'sites', 'create', 'Créer un site'],
            ['sites.update', 'sites', 'update', 'Modifier un site'],
            ['sites.delete', 'sites', 'delete', 'Supprimer un site non utilisé'],
            ['departements.read', 'departements', 'read', 'Consulter les départements'],
            ['departements.create', 'departements', 'create', 'Créer un département'],
            ['departements.update', 'departements', 'update', 'Modifier un département'],
            ['departements.delete', 'departements', 'delete', 'Supprimer un département non utilisé'],
            ['familles.read', 'familles', 'read', 'Consulter les familles d’impact'],
            ['familles.create', 'familles', 'create', 'Créer une famille d’impact'],
            ['familles.update', 'familles', 'update', 'Modifier une famille d’impact'],
            ['familles.delete', 'familles', 'delete', 'Supprimer une famille d’impact sans membre'],
            ['roles.read', 'roles', 'read', 'Consulter les rôles et les permissions'],
            ['roles.manage', 'roles', 'manage', 'Administrer les rôles et les permissions'],
            ['audit.read', 'audit', 'read', 'Consulter les traces d’audit'],
            ['systeme.manage', 'systeme', 'manage', 'Configuration technique, sessions et MFA'],
            ['pastorale.read', 'pastorale', 'read', 'Consulter les dossiers pastoraux habilités'],
            ['pastorale.create', 'pastorale', 'create', 'Créer un suivi pastoral'],
            ['pastorale.rdv', 'pastorale', 'rdv', 'Gérer les rendez-vous pastoraux'],
            ['activites.read', 'activites', 'read', 'Consulter les activités'],
            ['activites.create', 'activites', 'create', 'Créer une activité'],
            ['activites.update', 'activites', 'update', 'Modifier une activité'],
            ['budget.read', 'budget', 'read', 'Consulter un budget'],
            ['budget.request', 'budget', 'request', 'Demander une dépense'],
            ['rapports.read', 'rapports', 'read', 'Consulter les rapports'],
            ['rapports.create', 'rapports', 'create', 'Produire un rapport'],
            ['rapports.consolidate', 'rapports', 'consolidate', 'Contrôler et consolider les rapports'],
            ['finance.read', 'finance', 'read', 'Consulter les informations financières'],
            ['finance.manage', 'finance', 'manage', 'Comptabiliser et valider les opérations financières'],
            ['caisse.read', 'caisse', 'read', 'Consulter l’état de caisse'],
            ['caisse.manage', 'caisse', 'manage', 'Ouvrir, clôturer et mouvementer une caisse'],
            ['rh.read', 'rh', 'read', 'Consulter les dossiers RH autorisés'],
            ['rh.manage', 'rh', 'manage', 'Gérer le personnel, les contrats et les absences'],
            ['achats.read', 'achats', 'read', 'Consulter les achats et fournisseurs'],
            ['achats.manage', 'achats', 'manage', 'Piloter le processus d’achat'],
            ['logistique.read', 'logistique', 'read', 'Consulter le patrimoine et les stocks'],
            ['logistique.manage', 'logistique', 'manage', 'Gérer patrimoine, stocks et maintenance'],
            ['projets.read', 'projets', 'read', 'Consulter les projets'],
            ['projets.manage', 'projets', 'manage', 'Piloter le portefeuille de projets'],
            ['protocole.read', 'protocole', 'read', 'Consulter le calendrier pastoral administratif'],
            ['protocole.manage', 'protocole', 'manage', 'Qualifier et planifier les rendez-vous pastoraux'],
            ['secretariat.read', 'secretariat', 'read', 'Consulter courriers et réunions'],
            ['secretariat.manage', 'secretariat', 'manage', 'Gérer courriers, convocations et comptes rendus'],
            ['archives.read', 'archives', 'read', 'Rechercher des documents classés'],
            ['archives.manage', 'archives', 'manage', 'Classer, indexer et archiver'],
            ['technique.read', 'technique', 'read', 'Consulter les interventions techniques'],
            ['technique.manage', 'technique', 'manage', 'Clôturer les interventions assignées'],
            ['equipes.read', 'equipes', 'read', 'Consulter les équipes'],
            ['equipes.manage', 'equipes', 'manage', 'Affecter les responsabilités et les bénévoles'],
            ['objectifs.read', 'objectifs', 'read', 'Consulter les objectifs'],
            ['objectifs.manage', 'objectifs', 'manage', 'Suivre les objectifs, écarts et plans d’action'],
            ['demandes.read', 'demandes', 'read', 'Suivre les demandes'],
            ['demandes.create', 'demandes', 'create', 'Créer une demande'],
            ['alertes.read', 'alertes', 'read', 'Suivre les alertes'],
            ['performances.read', 'performances', 'read', 'Suivre les performances'],
        ];
    }
}
