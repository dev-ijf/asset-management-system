<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MaintenanceReadOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('system.maintenance.readonly_mode', false) && ! $request->isMethodSafe()) {
            return redirect()->back()->withErrors(['readonly' => 'Sistem sedang dalam mode read-only (maintenance).']);
        }

        return $next($request);
    }
}
