<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GradoController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/blockchain', [GradoController::class, 'index']);
Route::post('/blockchain/mine', [GradoController::class, 'store']);
Route::get('/blockchain/validate', [GradoController::class, 'validateChain']);
