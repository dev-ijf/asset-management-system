<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use App\Http\Middleware\MaintenanceReadOnly;
use App\Http\Middleware\SessionTimeout;
use App\Http\Middleware\AuditRequest;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role'               => RoleMiddleware::class,
            'permission'         => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'maintenance.readonly' => MaintenanceReadOnly::class,
            'session.timeout' => SessionTimeout::class,
            'audit.request' => AuditRequest::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('asset:notify-due')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
