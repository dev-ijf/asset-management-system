<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\DashboardsController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\Master\AssetStatusController;
use App\Http\Controllers\Master\AssetClassController;
use App\Http\Controllers\Master\UnitController;
use App\Http\Controllers\Master\DepartmentController;
use App\Http\Controllers\Master\PersonInChargeController;
use App\Http\Controllers\Master\AssetUserController;
use App\Http\Controllers\Master\AssetCategoryController;
use App\Http\Controllers\Master\AssetLocationController;
use App\Http\Controllers\Master\WarrantyController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AssetTransactionController;
use App\Http\Controllers\AssetAuditController;
use App\Http\Controllers\AssetTransactionPageController;
use App\Http\Controllers\Controller;

Route::get('/', function () {
    return view('welcome');
});

/******** Dashboards ********/
Route::get('/', function () {
    return redirect('index'); // This will redirect '/' to '/index'
});

// Route::get('/', [DashboardsController::class, 'index']);
Route::get('index', [DashboardsController::class, 'index']);

Route::resource('settings', SystemSettingController::class)->only(['index', 'store', 'update', 'destroy']);

Route::resource('roles', RoleController::class)->only(['index', 'store', 'update']);
Route::resource('permissions', PermissionController::class)->only(['index', 'store', 'update']);
Route::resource('users', UserManagementController::class)->only(['index', 'store', 'update']);

Route::resource('asset-statuses', AssetStatusController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('asset-classes', AssetClassController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('units', UnitController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('departments', DepartmentController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('person-in-charge', PersonInChargeController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('asset-users', AssetUserController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('asset-categories', AssetCategoryController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('asset-locations', AssetLocationController::class)->only(['index', 'store', 'update', 'destroy']);
Route::resource('warranties', WarrantyController::class)->only(['index', 'store', 'update', 'destroy']);
Route::get('assets/{asset}/history', [AssetController::class, 'history'])->name('assets.history');
Route::resource('assets', AssetController::class)->only(['index', 'store', 'update', 'show']);
Route::post('assets/{asset}/movements', [AssetTransactionController::class, 'storeMovement'])->name('assets.movements.store');
Route::post('assets/{asset}/disposals', [AssetTransactionController::class, 'storeDisposal'])->name('assets.disposals.store');
Route::post('asset-disposals/{disposal}/reverse', [AssetTransactionController::class, 'reverseDisposal'])->name('assets.disposals.reverse');
Route::post('assets/{asset}/audits', [AssetAuditController::class, 'store'])->name('assets.audits.store');
Route::get('asset-movements', [AssetTransactionPageController::class, 'movements'])->name('asset-movements.index');
Route::get('asset-disposals', [AssetTransactionPageController::class, 'disposals'])->name('asset-disposals.index');
Route::get('asset-audits', [AssetTransactionPageController::class, 'audits'])->name('asset-audits.index');
