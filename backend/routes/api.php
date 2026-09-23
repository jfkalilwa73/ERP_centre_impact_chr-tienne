<?php

use App\Http\Controllers\Api\V1\Auth\SessionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Identite\PersonneController;
use App\Http\Controllers\Api\V1\Identite\CompteController;
use App\Http\Controllers\Api\V1\Acces\RoleController;
use App\Http\Controllers\Api\V1\Acces\PermissionController;
use App\Http\Controllers\Api\V1\Acces\AffectationRoleController;
use App\Http\Controllers\Api\V1\Acces\AttribuerPermissionController;
Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [SessionController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [SessionController::class, 'logout']);
        Route::get('/auth/me', [SessionController::class, 'me']);
        Route::post('/identite/personnes', [PersonneController::class, 'store']);
        Route::post('/identite/comptes', [CompteController::class, 'store']);
        Route::post('/acces/roles', [RoleController::class, 'store']);
        Route::post('/acces/permissions', [PermissionController::class, 'store']);
        Route::post('/acces/comptes/{user}/roles', [AffectationRoleController::class, 'store']);
        Route::post('/acces/roles/{role}/permissions', [AttribuerPermissionController::class, 'store']);
    });
});