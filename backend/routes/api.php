<?php

use App\Http\Controllers\Api\V1\Auth\SessionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Identite\PersonneController;
use App\Http\Controllers\Api\V1\Identite\CompteController;
Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [SessionController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [SessionController::class, 'logout']);
        Route::get('/auth/me', [SessionController::class, 'me']);
        Route::post('/identite/personnes', [PersonneController::class, 'store']);
        Route::post('/identite/comptes', [CompteController::class, 'store']);
    });
});