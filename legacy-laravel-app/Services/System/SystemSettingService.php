<?php

namespace App\Services\System;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use App\Models\Setting;

class SystemSettingService
{
    private const CACHE_KEY = 'system.settings';

    /**
     * Ambil semua konfigurasi sistem dengan struktur terkelompok.
     */
    public function all(): array
    {
        $defaults = config('system', []);
        $overrides = Cache::rememberForever(self::CACHE_KEY, fn () => $this->loadFromDatabase());

        // Override nilai default dengan data database agar dapat full customize.
        return array_replace_recursive($defaults, $overrides);
    }

    /**
     * Ambil satu nilai konfigurasi dengan dukungan dot notation.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return Arr::get($this->all(), $key, $default);
    }

    /**
     * Set konfigurasi secara runtime tanpa menyentuh database.
     */
    public function set(string $key, mixed $value, ?string $type = null, ?string $description = null, ?string $group = null, bool $isPublic = false): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'group' => $group ?? $this->guessGroupFromKey($key),
                'type' => $type ?? $this->inferType($value),
                'value' => $value,
                'description' => $description,
                'is_public' => $isPublic,
            ]
        );

        $this->refresh();
    }

    /**
     * Refresh cache & config setelah update agar konsisten.
     */
    public function refresh(): void
    {
        Cache::forget(self::CACHE_KEY);
        config(['system' => $this->all()]);
    }

    private function loadFromDatabase(): array
    {
        $settings = [];

        Setting::query()->orderBy('key')->get()->each(function (Setting $setting) use (&$settings) {
            Arr::set($settings, $setting->key, $setting->value);
        });

        return $settings;
    }

    private function inferType(mixed $value): string
    {
        return match (true) {
            is_bool($value) => 'boolean',
            is_int($value) => 'integer',
            is_float($value) => 'float',
            is_array($value) => 'array',
            default => 'string',
        };
    }

    private function guessGroupFromKey(string $key): string
    {
        return explode('.', $key)[0] ?? 'general';
    }
}
