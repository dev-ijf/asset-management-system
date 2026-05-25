<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureDatabaseReady
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('setup*')) {
            return $next($request);
        }

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            return redirect()->route('setup.index')
                ->withErrors(['db' => 'Database belum dikonfigurasi. Silakan lengkapi pengaturan DB & migrate sebelum melanjutkan.']);
        }

        return $next($request);
    }
}
