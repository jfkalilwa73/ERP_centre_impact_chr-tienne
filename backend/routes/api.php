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

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [SessionController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [SessionController::class, 'logout']);
        Route::get('/auth/me', [SessionController::class, 'me']);
        Route::get('/personnes', [PersonneController::class, 'index']);
        Route::get('/personnes/{personneId}', [PersonneController::class, 'show']);
        Route::get('/personnes/{personneId}/departements', [AffectationDepartementController::class, 'index']);
        Route::post('/personnes', [PersonneController::class, 'store']);
        Route::post('/identite/personnes', [PersonneController::class, 'store']);
        Route::get('/comptes', [CompteController::class, 'index']);
        Route::get('/comptes/{compteId}', [CompteController::class, 'show']);
        Route::post('/comptes', [CompteController::class, 'store']);
        Route::get('/comptes/{compteId}/roles', [AffectationRoleController::class, 'index']);
        Route::post('/comptes/{user}/roles', [AffectationRoleController::class, 'store']);
        Route::post('/identite/comptes', [CompteController::class, 'store']);
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/roles/{roleId}', [RoleController::class, 'show']);
        Route::patch('/roles/{roleId}', [RoleController::class, 'update']);
        Route::delete('/roles/{roleId}', [RoleController::class, 'destroy']);
        Route::get('/roles/{roleId}/permissions', [AttribuerPermissionController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::post('/acces/comptes/{user}/roles', [AffectationRoleController::class, 'store']);
        Route::post('/roles/{role}/permissions', [AttribuerPermissionController::class, 'store']);
        Route::get('/permissions/{permissionId}/comptes', [PermissionController::class, 'comptes']);
        Route::get('/sites', [SiteController::class, 'index']);       
        Route::post('/sites', [SiteController::class, 'store']);
        Route::get('/departements', [DepartementController::class, 'index']);
        Route::post('/departements', [DepartementController::class, 'store']);
        Route::post('/personnes/{personne}/departements', [AffectationDepartementController::class, 'store']);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);        
        Route::post('/personnes/{personne}/departements', [AffectationDepartementController::class, 'store']);        
        Route::get('/audit/logs', [AuditLogController::class, 'index']);
        Route::get('/comptes/{user}/permissions/{permissionCode}', [VerifierDroitController::class, 'show']);        
        Route::delete('/personnes/{personne}', [PersonneController::class, 'destroy']);    });
});