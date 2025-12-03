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
use App\Http\Controllers\Master\VendorController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AssetTransactionController;
use App\Http\Controllers\AssetAuditController;
use App\Http\Controllers\AssetTransactionPageController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AssetMaintenanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AssetPhotoController;
use App\Http\Controllers\PublicAssetController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\ProfileController;

Route::get('setup', [\App\Http\Controllers\SetupWizardController::class, 'index'])->name('setup.index');
Route::post('setup', [\App\Http\Controllers\SetupWizardController::class, 'store'])->name('setup.store');
Route::post('setup/migrate', [\App\Http\Controllers\SetupWizardController::class, 'migrate'])->name('setup.migrate');

Route::middleware('db.ready')->group(function () {
    Route::view('/', 'pages.landing.index')->name('landing');
    Route::view('/landing', 'pages.landing.index');

    Route::get('asset-view/{asset}', [PublicAssetController::class, 'show'])->name('assets.public.show');
    Route::view('help', 'pages.landing.help')->name('landing.help');
    Route::view('changelog', 'pages.landing.changelog')->name('landing.changelog');
    Route::view('api-docs', 'pages.api.docs')->name('api.docs');

    // Transaksi dari halaman landing (user harus login)
    Route::middleware(['auth','audit.request'])->group(function () {
        Route::post('asset-view/{asset}/movement', [AssetTransactionController::class, 'storeMovement'])->name('assets.public.movements.store')
            ->middleware('permission:movements.manage');
        Route::post('asset-view/{asset}/disposal', [AssetTransactionController::class, 'storeDisposal'])->name('assets.public.disposals.store')
            ->middleware('permission:disposals.manage');
        Route::post('asset-view/{asset}/maintenance', [AssetMaintenanceController::class, 'store'])->name('assets.public.maintenances.store')
            ->middleware('permission:maintenance.manage');
    });

    Route::middleware(['auth','maintenance.readonly','session.timeout','audit.request'])->prefix('dashboard')->group(function () {
        Route::get('index', [DashboardsController::class, 'index'])->name('index');

        Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::put('profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
        Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
        Route::post('profile/2fa/setup', [ProfileController::class, 'setup2fa'])->name('profile.2fa.setup');
        Route::post('profile/2fa/confirm', [ProfileController::class, 'confirm2fa'])->name('profile.2fa.confirm');
        Route::delete('profile/2fa/disable', [ProfileController::class, 'disable2fa'])->name('profile.2fa.disable');

        Route::resource('settings', SystemSettingController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:settings.manage');

        Route::resource('roles', RoleController::class)->only(['index', 'store', 'update'])
            ->middleware('permission:roles.manage');
        Route::resource('permissions', PermissionController::class)->only(['index', 'store', 'update'])
            ->middleware('permission:permissions.manage');
        Route::resource('users', UserManagementController::class)->only(['index', 'store', 'update'])
            ->middleware('permission:users.manage');

        Route::resource('asset-statuses', AssetStatusController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('asset-classes', AssetClassController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('units', UnitController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('departments', DepartmentController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('person-in-charge', PersonInChargeController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('asset-users', AssetUserController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('asset-categories', AssetCategoryController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('asset-locations', AssetLocationController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('warranties', WarrantyController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');
        Route::resource('vendor-contracts', VendorController::class)->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:assets.manage');

    Route::get('assets/{asset}/history', [AssetController::class, 'history'])->name('assets.history')->middleware('permission:assets.view');
    Route::resource('assets', AssetController::class)->only(['index', 'store', 'update', 'show', 'destroy'])
        ->middleware(['permission:assets.view|assets.manage']);
    Route::post('assets/{asset}/archive', [AssetController::class, 'archive'])->name('assets.archive')->middleware('permission:assets.manage');
    Route::post('assets/{asset}/unarchive', [AssetController::class, 'unarchive'])->name('assets.unarchive')->middleware('permission:assets.manage');
    Route::post('assets/{asset}/restore', [AssetController::class, 'restore'])->name('assets.restore')->middleware('permission:assets.manage');
    Route::get('assets-export', [AssetController::class, 'exportCsv'])->name('assets.export')->middleware('permission:assets.view');
    Route::post('assets-import', [AssetController::class, 'import'])->name('assets.import')->middleware('permission:assets.manage');
        Route::post('assets/{asset}/photos', [AssetPhotoController::class, 'store'])->name('assets.photos.store')
            ->middleware('permission:assets.manage');
        Route::delete('asset-photos/{asset_photo}', [AssetPhotoController::class, 'destroy'])->name('assets.photos.destroy')
            ->middleware('permission:assets.manage');

        Route::post('assets/{asset}/movements', [AssetTransactionController::class, 'storeMovement'])->name('assets.movements.store')
            ->middleware('permission:movements.manage');
        Route::post('assets/{asset}/disposals', [AssetTransactionController::class, 'storeDisposal'])->name('assets.disposals.store')
            ->middleware('permission:disposals.manage');
        Route::post('asset-disposals/{disposal}/reverse', [AssetTransactionController::class, 'reverseDisposal'])->name('assets.disposals.reverse')
            ->middleware('permission:disposals.manage');
        Route::post('assets/{asset}/audits', [AssetAuditController::class, 'store'])->name('assets.audits.store')
            ->middleware('permission:audits.manage');

        Route::get('asset-movements', [AssetTransactionPageController::class, 'movements'])->name('asset-movements.index')->middleware('permission:movements.manage');
        Route::get('asset-disposals', [AssetTransactionPageController::class, 'disposals'])->name('asset-disposals.index')->middleware('permission:disposals.manage');
        Route::get('asset-audits', [AssetTransactionPageController::class, 'audits'])->name('asset-audits.index')->middleware('permission:audits.manage');

        Route::get('reports/assets', [ReportController::class, 'assets'])->name('reports.assets')->middleware('permission:reports.view');
        Route::get('reports/movements', [ReportController::class, 'movements'])->name('reports.movements')->middleware('permission:reports.view');
        Route::get('reports/disposals', [ReportController::class, 'disposals'])->name('reports.disposals')->middleware('permission:reports.view');
        Route::get('reports/audits', [ReportController::class, 'audits'])->name('reports.audits')->middleware('permission:reports.view');
        Route::get('reports/depreciations', [ReportController::class, 'depreciations'])->name('reports.depreciations')->middleware('permission:reports.view');

        Route::resource('asset-maintenances', AssetMaintenanceController::class)->only(['index','store','update','destroy'])
            ->middleware('permission:maintenance.manage');

        Route::get('approvals', [\App\Http\Controllers\ApprovalController::class, 'index'])->name('approvals.index')->middleware('permission:approvals.manage');
        Route::post('approvals/{approval}/approve', [\App\Http\Controllers\ApprovalController::class, 'approve'])->name('approvals.approve')->middleware('permission:approvals.manage');
        Route::post('approvals/{approval}/reject', [\App\Http\Controllers\ApprovalController::class, 'reject'])->name('approvals.reject')->middleware('permission:approvals.manage');
    });

    // Auth & 2FA routes (redirect ke setup bila DB belum siap)
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
    Route::get('register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('two-factor-challenge', [AuthController::class, 'showTwoFactorChallenge'])->name('twofactor.challenge');
    Route::post('two-factor-challenge', [AuthController::class, 'verifyTwoFactorChallenge'])->name('twofactor.verify');
});
