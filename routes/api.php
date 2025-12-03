<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AssetApiController;
use App\Http\Controllers\Api\AssetTransactionApiController;

Route::middleware(['api.key'])->prefix('v1')->group(function () {
    Route::get('assets', [AssetApiController::class, 'index']);
    Route::get('assets/{asset}', [AssetApiController::class, 'show']);

    Route::post('assets/{asset}/movements', [AssetTransactionApiController::class, 'storeMovement']);
    Route::post('assets/{asset}/disposals', [AssetTransactionApiController::class, 'storeDisposal']);
    Route::post('assets/{asset}/audits', [AssetTransactionApiController::class, 'storeAudit']);
});
