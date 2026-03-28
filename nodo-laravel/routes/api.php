<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GradoController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/blockchain', [GradoController::class, 'index']);
Route::post('/blockchain/mine', [GradoController::class, 'mine']);
Route::get('/blockchain/validate', [GradoController::class, 'validateChain']);
Route::get('/blockchain/resolve', [GradoController::class, 'resolve']);
Route::post('/blockchain/receive-block', [GradoController::class, 'receiveBlock']);

Route::post('/transactions', [GradoController::class, 'storeTransaction']);

Route::post('/nodes/register', [GradoController::class, 'registerNode']);
Route::get('/nodes', [GradoController::class, 'getNodes']);
