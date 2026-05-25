<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            DB::connection()->getPdo();
            app()->instance('db.ready', true);
        } catch (\Throwable $e) {
            // Fallback agar aplikasi tetap jalan ke halaman setup
            config(['session.driver' => 'file']);
            config(['cache.default' => 'file']);
            app()->instance('db.ready', false);
        }
    }
}
