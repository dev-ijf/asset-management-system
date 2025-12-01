<?php

namespace App\Services\System;

use Illuminate\Support\Arr;

class SystemSettingService
{
    /**
     * Ambil semua konfigurasi sistem dengan struktur terkelompok.
     */
    public function all(): array
    {
        return config('system', []);
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
    public function set(string $key, mixed $value): void
    {
        $settings = $this->all();
        Arr::set($settings, $key, $value);

        config(['system' => $settings]);
    }
}
