<?php

use App\Http\Controllers\Api\V1\Auth\SessionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Identite\PersonneController;
use App\Http\Controllers\Api\V1\Identite\CompteController;
use App\Http\Controllers\Api\V1\Acces\RoleController;
use App\Http\Controllers\Api\V1\Acces\PermissionController;
use App\Http\Controllers\Api\V1\Acces\AffectationRoleController;
use App\Http\Controllers\Api\V1\Acces\AttribuerPermissionController;
use App\Http\Controllers\Api\V1\Organisation\SiteController;
use App\Http\Controllers\Api\V1\Organisation\DepartementController;
use App\Http\Controllers\Api\V1\Organisation\AffectationDepartementController;
use App\Http\Controllers\Api\V1\Audit\AuditLogController;
use App\Http\Controllers\Api\V1\Acces\VerifierDroitController;
use App\Http\Controllers\Api\V1\Famille\FamilleImpactController;
use App\Http\Controllers\Api\V1\Famille\AffectationFamilleController;
use App\Http\Controllers\Api\V1\Pilotage\PilotageController;
use App\Http\Controllers\Api\V1\Sprint1\MembreController;
use App\Http\Controllers\Api\V1\Sprint1\PresenceFamilleController;
use App\Http\Controllers\Api\V1\Sprint1\RegroupementController;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [SessionController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [SessionController::class, 'logout']);
        Route::get('/auth/me', [SessionController::class, 'me']);
        Route::get('/personnes', [PersonneController::class, 'index']);
        Route::get('/personnes/{personneId}', [PersonneController::class, 'show']);
        Route::patch('/personnes/{personneId}', [PersonneController::class, 'update']);
        Route::get('/personnes/{personneId}/departements', [AffectationDepartementController::class, 'index']);
        Route::post('/personnes', [PersonneController::class, 'store']);
        Route::post('/identite/personnes', [PersonneController::class, 'store']);
        Route::get('/comptes', [CompteController::class, 'index']);
        Route::get('/comptes/{compteId}', [CompteController::class, 'show']);
        Route::patch('/comptes/{compteId}', [CompteController::class, 'update']);
        Route::delete('/comptes/{compteId}', [CompteController::class, 'destroy']);
        Route::post('/comptes', [CompteController::class, 'store']);
        Route::get('/comptes/{compteId}/roles', [AffectationRoleController::class, 'index']);
        Route::post('/comptes/{user}/roles', [AffectationRoleController::class, 'store']);
        Route::delete('/comptes/{compteId}/roles/{roleId}', [AffectationRoleController::class, 'destroy']);
        Route::post('/identite/comptes', [CompteController::class, 'store']);
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/roles/{roleId}', [RoleController::class, 'show']);
        Route::patch('/roles/{roleId}', [RoleController::class, 'update']);
        Route::delete('/roles/{roleId}', [RoleController::class, 'destroy']);
        Route::get('/roles/{roleId}/permissions', [AttribuerPermissionController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::get('/permissions/{permissionId}', [PermissionController::class, 'show']);
        Route::get('/permissions/{permissionId}/roles', [PermissionController::class, 'roles']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::patch('/permissions/{permissionId}', [PermissionController::class, 'update']);
        Route::delete('/permissions/{permissionId}', [PermissionController::class, 'destroy']);
        Route::post('/acces/comptes/{user}/roles', [AffectationRoleController::class, 'store']);
        Route::post('/roles/{role}/permissions', [AttribuerPermissionController::class, 'store']);
        Route::delete('/roles/{roleId}/permissions/{permissionId}', [AttribuerPermissionController::class, 'destroy']);
        Route::get('/permissions/{permissionId}/comptes', [PermissionController::class, 'comptes']);
        Route::get('/sites', [SiteController::class, 'index']);       
        Route::get('/sites/{siteId}', [SiteController::class, 'show']);
        Route::patch('/sites/{siteId}', [SiteController::class, 'update']);
        Route::delete('/sites/{siteId}', [SiteController::class, 'destroy']);
        Route::post('/sites', [SiteController::class, 'store']);
        Route::get('/departements', [DepartementController::class, 'index']);
        Route::get('/departements/{departementId}', [DepartementController::class, 'show']);
        Route::patch('/departements/{departementId}', [DepartementController::class, 'update']);
        Route::delete('/departements/{departementId}', [DepartementController::class, 'destroy']);
        Route::post('/departements', [DepartementController::class, 'store']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);        
        Route::get('/audit-logs/{auditId}', [AuditLogController::class, 'show']);
        Route::post('/personnes/{personne}/departements', [AffectationDepartementController::class, 'store']);        
        Route::get('/audit/logs', [AuditLogController::class, 'index']);
        Route::get('/comptes/{user}/permissions/{permissionCode}', [VerifierDroitController::class, 'show']);        
        Route::delete('/personnes/{personne}', [PersonneController::class, 'destroy']);

        Route::get('/familles-impact', [FamilleImpactController::class, 'index']);
        Route::post('/familles-impact', [FamilleImpactController::class, 'store']);
        Route::get('/familles-impact/{familleId}', [FamilleImpactController::class, 'show']);
        Route::patch('/familles-impact/{familleId}', [FamilleImpactController::class, 'update']);
        Route::delete('/familles-impact/{familleId}', [FamilleImpactController::class, 'destroy']);
        Route::get('/personnes/{personneId}/familles-impact', [AffectationFamilleController::class, 'index']);
        Route::post('/personnes/{personneId}/familles-impact', [AffectationFamilleController::class, 'store']);
        Route::delete('/personnes/{personneId}/familles-impact/{familleId}', [AffectationFamilleController::class, 'destroy']);
        Route::delete('/personnes/{personneId}/departements/{departementId}', [AffectationDepartementController::class, 'destroy']);

        Route::get('/pilotage', [PilotageController::class, 'show']);
        Route::put('/pilotage', [PilotageController::class, 'update']);

        Route::get('/membres', [MembreController::class, 'index']);
        Route::get('/personnes/{personneId}/membre', [MembreController::class, 'showPourPersonne']);
        Route::post('/personnes/{personneId}/membre', [MembreController::class, 'store']);
        Route::patch('/membres/{membreId}', [MembreController::class, 'updateStatut']);
        Route::get('/membres/{membreId}/historique', [MembreController::class, 'historique']);

        Route::get('/personnes/{personneId}/regroupement', [RegroupementController::class, 'showPourPersonne']);
        Route::post('/regroupements', [RegroupementController::class, 'store']);
        Route::patch('/regroupements/{regroupementId}', [RegroupementController::class, 'update']);
        Route::post('/regroupements/{regroupementId}/relations', [RegroupementController::class, 'storeRelation']);
        Route::delete('/regroupements/{regroupementId}/relations/{relationId}', [RegroupementController::class, 'destroyRelation']);

        Route::post('/familles-impact/{familleId}/suivi', [PresenceFamilleController::class, 'synchroniser']);
        Route::get('/familles-impact/{familleId}/presences', [PresenceFamilleController::class, 'index']);
        Route::put('/familles-impact/{familleId}/presences', [PresenceFamilleController::class, 'store']);
    });
});
