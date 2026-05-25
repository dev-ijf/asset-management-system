<?php

namespace App\Services\Logging;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ActivityLogger
{
    public const CHANNEL = 'asset_activity';

    /**
     * Field yang disembunyikan agar tidak tercatat mentah di log.
     */
    private array $hiddenRequestFields = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
    ];

    /**
     * Tulis log aktivitas ke file dengan metadata yang mudah dibaca.
     */
    public function log(string $message, array $context = [], string $level = 'info'): void
    {
        if (! config('system.security.audit_log', true)) {
            return;
        }

        $request = request();

        $payload = array_merge([
            'action' => $message,
            'actor_id' => optional(auth()->user())->getAuthIdentifier(),
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'request_id' => $request?->headers->get('X-Request-Id'),
            'performed_at' => now()->toIso8601String(),
        ], $context);

        $payload['request_id'] = $payload['request_id'] ?? Str::uuid()->toString();

        Log::channel(self::CHANNEL)->log($level, $message, $payload);
    }

    /**
     * Tulis log request/response agar debugging controller lebih cepat.
     */
    public function logHttp(string $action, Request $request, mixed $response = null, array $context = [], string $level = 'info'): void
    {
        if (! config('system.security.audit_log', true)) {
            return;
        }

        $payload = [
            'action' => $action,
            'actor_id' => optional(auth()->user())->getAuthIdentifier(),
            'request_id' => $request->headers->get('X-Request-Id') ?? Str::uuid()->toString(),
            'performed_at' => now()->toIso8601String(),
            'http' => [
                'method' => $request->getMethod(),
                'uri' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'body' => $this->maskSensitiveFields($request->all()),
            ],
        ];

        if ($response instanceof Response) {
            $payload['http']['response'] = $this->normalizeResponse($response);
        }

        if (! empty($context)) {
            $payload['context'] = $context;
        }

        Log::channel(self::CHANNEL)->log($level, $action, $payload);
    }

    /**
     * Tulis audit terstruktur (dipakai middleware/listener).
     */
    public function audit(array $data, string $level = 'info'): void
    {
        if (! config('system.security.audit_log', true)) {
            return;
        }

        $payload = array_merge([
            'performed_at' => now()->toIso8601String(),
            'request_id' => app()->bound('audit.request_id') ? app('audit.request_id') : Str::uuid()->toString(),
            'actor_id' => optional(auth()->user())->getAuthIdentifier(),
        ], $data);

        Log::channel(self::CHANNEL)->log($level, $data['action'] ?? 'audit', $payload);
    }

    private function maskSensitiveFields(array $input): array
    {
        foreach ($input as $key => &$value) {
            if (in_array($key, $this->hiddenRequestFields, true)) {
                $value = '[MASKED]';
            }
        }

        return $input;
    }

    private function normalizeResponse(Response $response): array
    {
        $body = $response instanceof JsonResponse
            ? $response->getData(true)
            : $response->getContent();

        if (is_string($body) && strlen($body) > 2000) {
            $body = Str::limit($body, 2000, '...[terpotong]');
        }

        return [
            'status' => $response->getStatusCode(),
            'body' => $body,
        ];
    }
}
