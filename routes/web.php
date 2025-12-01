<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\DashboardsController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\UserManagementController;
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
