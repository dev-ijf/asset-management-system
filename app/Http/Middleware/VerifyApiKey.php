<?php

namespace App\Http\Middleware;

use App\Services\System\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiKey
{
    public function __construct(private readonly SystemSettingService $settings)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $expected = $this->settings->get('integration.api_key') ?? config('services.integration.api_key');
        $provided = $request->header('X-Api-Key');

        if (empty($expected) || $provided !== $expected) {
            return response()->json(['message' => 'Unauthorized: invalid API key'], 401);
        }

        return $next($request);
    }
}
