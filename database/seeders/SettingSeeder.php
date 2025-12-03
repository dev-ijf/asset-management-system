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
            ['key' => 'asset.rfid_required', 'value' => false, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Wajibkan pengisian RFID ketika aset dibuat/di-update'],
            ['key' => 'asset.nfc_required', 'value' => false, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Wajibkan pengisian NFC ketika aset dibuat/di-update'],
            ['key' => 'asset.rfid_auto_generate', 'value' => true, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Otomatis generate RFID jika kosong, menggunakan kode aset'],
            ['key' => 'asset.nfc_auto_generate', 'value' => true, 'type' => 'boolean', 'group' => 'asset', 'description' => 'Otomatis generate NFC jika kosong, menggunakan kode aset'],
            ['key' => 'asset.qr_format', 'value' => 'svg', 'type' => 'string', 'group' => 'asset', 'description' => 'Format file QR (svg/png/pdf)'],
            ['key' => 'asset.qr_size', 'value' => 300, 'type' => 'integer', 'group' => 'asset', 'description' => 'Ukuran sisi QR dalam pixel'],

            // Keamanan & audit
            ['key' => 'security.audit_log', 'value' => true, 'type' => 'boolean', 'group' => 'security', 'description' => 'Aktifkan audit log aktivitas'],
            ['key' => 'security.session_idle_minutes', 'value' => 30, 'type' => 'integer', 'group' => 'security', 'description' => 'Durasi sesi idle sebelum timeout'],
            ['key' => 'security.two_factor_enforced', 'value' => false, 'type' => 'boolean', 'group' => 'security', 'description' => 'Wajibkan 2FA untuk semua user (per-role bisa diatur manual)'],

            // Notifikasi
            ['key' => 'notification.email_enabled', 'value' => true, 'type' => 'boolean', 'group' => 'notification'],
            ['key' => 'notification.slack_webhook_url', 'value' => null, 'type' => 'string', 'group' => 'notification'],
            ['key' => 'notification.webhook_retry_attempts', 'value' => 3, 'type' => 'integer', 'group' => 'notification', 'description' => 'Jumlah retry webhook jika gagal'],
            ['key' => 'notification.import_result_email', 'value' => false, 'type' => 'boolean', 'group' => 'notification', 'description' => 'Kirim ringkasan hasil import ke email admin'],

            // Maintenance
            ['key' => 'maintenance.readonly_mode', 'value' => false, 'type' => 'boolean', 'group' => 'maintenance', 'description' => 'Jika true, seluruh fitur tulis dimatikan'],
            ['key' => 'maintenance.window', 'value' => null, 'type' => 'string', 'group' => 'maintenance', 'description' => 'Jadwal maintenance terencana'],

            // Integrasi & API
            ['key' => 'integration.api_key', 'value' => 'changeme-api-key', 'type' => 'string', 'group' => 'integration', 'description' => 'API Key untuk akses REST publik'],
            ['key' => 'integration.webhook_enabled', 'value' => false, 'type' => 'boolean', 'group' => 'integration', 'description' => 'Aktifkan webhook untuk event aset'],
            ['key' => 'integration.webhook_url', 'value' => null, 'type' => 'string', 'group' => 'integration', 'description' => 'Endpoint webhook ERP/CMMS/Helpdesk'],
            ['key' => 'integration.webhook_secret', 'value' => null, 'type' => 'string', 'group' => 'integration', 'description' => 'Secret untuk memverifikasi signature webhook'],
            ['key' => 'integration.api_rate_limit', 'value' => 120, 'type' => 'integer', 'group' => 'integration', 'description' => 'Rate limit API (permintaan per menit)'],
            ['key' => 'integration.webhook_timeout_seconds', 'value' => 5, 'type' => 'integer', 'group' => 'integration', 'description' => 'Timeout request webhook dalam detik'],

            // Import & data volume
            ['key' => 'asset.import_max_rows', 'value' => 2000, 'type' => 'integer', 'group' => 'import', 'description' => 'Batas maksimum baris per sekali import'],
            ['key' => 'asset.import_allow_remote_images', 'value' => true, 'type' => 'boolean', 'group' => 'import', 'description' => 'Izinkan download gambar dari URL saat import'],
            ['key' => 'asset.import_dedupe_priority', 'value' => 'code', 'type' => 'string', 'group' => 'import', 'description' => 'Prioritas deduplikasi: code atau serial'],
            ['key' => 'asset.import_default_status', 'value' => 'Active', 'type' => 'string', 'group' => 'import', 'description' => 'Status default jika kolom kosong pada import'],
            ['key' => 'asset.import_default_category', 'value' => null, 'type' => 'string', 'group' => 'import', 'description' => 'Kategori default jika kolom kosong pada import'],
            ['key' => 'asset.import_default_location', 'value' => null, 'type' => 'string', 'group' => 'import', 'description' => 'Lokasi default jika kolom kosong pada import'],

            // Retensi & arsip
            ['key' => 'asset.archive_retention_days', 'value' => 365, 'type' => 'integer', 'group' => 'archive', 'description' => 'Berapa hari aset diarsipkan sebelum ditinjau'],
            ['key' => 'asset.soft_delete_retention_days', 'value' => 30, 'type' => 'integer', 'group' => 'archive', 'description' => 'Berapa hari aset soft delete boleh di-restore'],
            ['key' => 'asset.archive_require_reason', 'value' => false, 'type' => 'boolean', 'group' => 'archive', 'description' => 'Wajibkan alasan saat arsip aset'],

            // Stok & pool
            ['key' => 'asset.consumable_low_stock_threshold', 'value' => 5, 'type' => 'integer', 'group' => 'stock', 'description' => 'Ambang batas stok rendah untuk consumable'],
            ['key' => 'asset.pool_checkout_requires_approval', 'value' => false, 'type' => 'boolean', 'group' => 'stock', 'description' => 'Pinjam aset pool butuh approval'],
            ['key' => 'asset.pool_max_days_checkout', 'value' => 30, 'type' => 'integer', 'group' => 'stock', 'description' => 'Batas maksimum hari peminjaman aset pool'],

            // Workflow per transaksi
            ['key' => 'asset.workflow.auto_approve_movement', 'value' => false, 'type' => 'boolean', 'group' => 'workflow', 'description' => 'Otomatis approve movement tanpa persetujuan manual'],
            ['key' => 'asset.workflow.auto_approve_disposal', 'value' => false, 'type' => 'boolean', 'group' => 'workflow', 'description' => 'Otomatis approve disposal tanpa persetujuan manual'],
            ['key' => 'asset.workflow.auto_approve_maintenance', 'value' => false, 'type' => 'boolean', 'group' => 'workflow', 'description' => 'Otomatis approve maintenance tanpa persetujuan manual'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
