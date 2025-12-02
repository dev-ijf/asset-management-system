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
            ['key' => 'asset.rfid_enabled', 'value' => false, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Aktifkan input tag RFID'],
            ['key' => 'asset.nfc_enabled', 'value' => false, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Aktifkan input tag NFC'],
            ['key' => 'asset.label_template', 'value' => 'default', 'type' => 'string', 'group' => 'asset', 'description' => 'Template label/printing default'],
            ['key' => 'asset.warranty_reminder_days', 'value' => 30, 'type' => 'integer', 'group' => 'asset'],
            ['key' => 'asset.depreciation_method', 'value' => 'straight_line', 'type' => 'string', 'group' => 'asset'],
            ['key' => 'asset.attachment_max_size_mb', 'value' => 20, 'type' => 'integer', 'group' => 'asset', 'description' => 'Batas upload lampiran aset (MB)'],
            ['key' => 'asset.batch_update_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Izinkan batch update aset sejenis'],
            ['key' => 'asset.consumable_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Aktifkan stok consumable/pool pinjaman'],

            // Keamanan & audit
            ['key' => 'security.audit_log', 'value' => true, 'type' => 'boolean', 'group' => 'security', 'description' => 'Aktifkan audit log aktivitas'],

            // Notifikasi
            ['key' => 'notification.email_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'notification'],
            ['key' => 'notification.slack_webhook_url', 'value' => null, 'type' => 'string', 'group' => 'notification'],

            // Maintenance
            ['key' => 'maintenance.readonly_mode', 'value' => false, 'type' => 'boolean', 'group' => 'maintenance', 'description' => 'Jika true, seluruh fitur tulis dimatikan'],
            ['key' => 'maintenance.window', 'value' => null, 'type' => 'string', 'group' => 'maintenance', 'description' => 'Jadwal maintenance terencana'],

            // Integrasi & API
            ['key' => 'integration.api_key', 'value' => 'changeme-api-key', 'type' => 'string', 'group' => 'integration', 'description' => 'API Key untuk akses REST publik'],
            ['key' => 'integration.webhook_enabled', 'value' => false, 'type' => 'boolean', 'group' => 'integration', 'description' => 'Aktifkan webhook untuk event aset'],
            ['key' => 'integration.webhook_url', 'value' => null, 'type' => 'string', 'group' => 'integration', 'description' => 'Endpoint webhook ERP/CMMS/Helpdesk'],
            ['key' => 'integration.webhook_secret', 'value' => null, 'type' => 'string', 'group' => 'integration', 'description' => 'Secret untuk memverifikasi signature webhook'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
