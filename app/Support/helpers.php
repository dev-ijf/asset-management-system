<?php

use App\Services\Logging\ActivityLogger;

if (! function_exists('asset_activity_log')) {
    /**
     * Menulis log aktivitas aset ke channel khusus agar mudah dilacak.
     */
    function asset_activity_log(string $message, array $context = [], string $level = 'info'): void
    {
        app(ActivityLogger::class)->log($message, $context, $level);
    }
}

if (! function_exists('asset_request_log')) {
    /**
        * Mencatat request/response untuk kebutuhan debugging per aksi (mis. Login, Create Asset).
        */
    function asset_request_log(string $action, \Illuminate\Http\Request $request, mixed $response = null, array $context = [], string $level = 'info'): void
    {
        app(ActivityLogger::class)->logHttp($action, $request, $response, $context, $level);
    }
}
