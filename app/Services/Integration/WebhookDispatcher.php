<?php

namespace App\Services\Integration;

use App\Services\System\SystemSettingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookDispatcher
{
    public function __construct(private readonly SystemSettingService $settings)
    {
    }

    /**
    * Kirim webhook ke endpoint eksternal untuk sinkronisasi ERP/CMMS/Helpdesk.
    */
    public function send(string $event, array $data): void
    {
        $enabled = $this->settings->get('integration.webhook_enabled', false);
        $url = $this->settings->get('integration.webhook_url');
        if (!$enabled || empty($url)) {
            return;
        }

        $secret = $this->settings->get('integration.webhook_secret');
        $signature = $secret ? hash_hmac('sha256', json_encode($data), $secret) : null;

        try {
            Http::timeout(5)
                ->withHeaders(array_filter([
                    'X-Webhook-Event' => $event,
                    'X-Webhook-Signature' => $signature,
                ]))
                ->post($url, [
                    'event' => $event,
                    'data' => $data,
                    'sent_at' => now()->toIso8601String(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('Webhook dispatch failed', ['event' => $event, 'message' => $e->getMessage()]);
        }
    }
}
