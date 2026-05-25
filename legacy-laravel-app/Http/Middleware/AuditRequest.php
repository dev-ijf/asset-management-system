<?php

namespace App\Http\Middleware;

use App\Services\Logging\ActivityLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AuditRequest
{
    public function __construct(private readonly ActivityLogger $logger)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (!config('system.security.audit_log', true) || $request->isMethod('get')) {
            return $next($request);
        }

        $requestId = (string) Str::ulid();
        app()->instance('audit.request_id', $requestId);

        $start = microtime(true);
        /** @var Response $response */
        $response = $next($request);
        $duration = (int) ((microtime(true) - $start) * 1000);

        $payload = $this->sanitize($request->except(['password', 'password_confirmation', 'current_password', '_token', '_method']));

        $this->logger->audit([
            'action' => 'http_action',
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
            'route' => $request->route()?->getName(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'body' => $payload,
        ]);

        return $response;
    }

    private function sanitize(array $input): array
    {
        $maxBody = config('system.security.audit_max_body', 5000);
        array_walk_recursive($input, function (&$value) use ($maxBody) {
            if (is_string($value) && strlen($value) > $maxBody) {
                $value = substr($value, 0, $maxBody) . '...[terpotong]';
            }
        });

        return $input;
    }
}
