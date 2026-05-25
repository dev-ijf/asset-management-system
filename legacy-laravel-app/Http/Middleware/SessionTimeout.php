<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SessionTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            // Mengikuti key setting yang disimpan di database (`security.session_idle_minutes`).
            // Fallback ke key lama jika ada, agar backward compatible.
            $timeout = (int) (config('system.security.session_idle_minutes')
                ?? config('system.security.session_idle_timeout_minutes', 30));
            $last = session('last_active_at');

            if ($last && now()->diffInMinutes($last) >= $timeout) {
                auth()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors(['session' => 'Sesi berakhir karena tidak ada aktivitas. Silakan login kembali.']);
            }

            session(['last_active_at' => now()]);
            $request->user()->forceFill(['last_active_at' => now()])->saveQuietly();
        }

        return $next($request);
    }
}
