<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Seed awal agar sistem langsung bisa dikustomisasi.
     */
    public function run(): void
    {
        $settings = [
            // Aplikasi & UI
            ['key' => 'application.name', 'value' => 'Asset Management System', 'type' => 'string', 'group' => 'application', 'description' => 'Nama aplikasi yang tampil di UI'],
            ['key' => 'application.timezone', 'value' => 'Asia/Jakarta', 'type' => 'string', 'group' => 'application'],
            ['key' => 'ui.date_format', 'value' => 'd/m/Y', 'type' => 'string', 'group' => 'ui'],
            ['key' => 'ui.time_format', 'value' => 'H:i', 'type' => 'string', 'group' => 'ui'],
            ['key' => 'ui.currency', 'value' => 'IDR', 'type' => 'string', 'group' => 'ui'],
            ['key' => 'ui.table_page_size', 'value' => 25, 'type' => 'integer', 'group' => 'ui', 'description' => 'Default jumlah baris tabel per halaman'],

            // Aset
            ['key' => 'asset.code_prefix', 'value' => 'AST', 'type' => 'string', 'group' => 'asset'],
            ['key' => 'asset.qr_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'asset'],
            ['key' => 'asset.warranty_reminder_days', 'value' => 30, 'type' => 'integer', 'group' => 'asset'],
            ['key' => 'asset.depreciation_method', 'value' => 'straight_line', 'type' => 'string', 'group' => 'asset'],
            ['key' => 'asset.attachment_max_size_mb', 'value' => 20, 'type' => 'integer', 'group' => 'asset', 'description' => 'Batas upload lampiran aset (MB)'],

            // Keamanan & audit
            ['key' => 'security.audit_log', 'value' => true, 'type' => 'boolean', 'group' => 'security', 'description' => 'Aktifkan audit log aktivitas'],

            // Notifikasi
            ['key' => 'notification.email_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'notification'],
            ['key' => 'notification.slack_webhook_url', 'value' => null, 'type' => 'string', 'group' => 'notification'],

            // Maintenance
            ['key' => 'maintenance.readonly_mode', 'value' => false, 'type' => 'boolean', 'group' => 'maintenance', 'description' => 'Jika true, seluruh fitur tulis dimatikan'],
            ['key' => 'maintenance.window', 'value' => null, 'type' => 'string', 'group' => 'maintenance', 'description' => 'Jadwal maintenance terencana'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
