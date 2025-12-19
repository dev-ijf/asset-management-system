# Dokumentasi Lengkap Asset Management System

Dokumen ini menjadi referensi utama untuk developer/ops yang ingin memahami alur, konfigurasi, dan fitur lengkap sistem.

## Isi Singkat
- [Arsitektur Ringkas](#arsitektur-ringkas)
- [Alur Penggunaan](#alur-penggunaan)
- [Setup & Wizard](#setup--wizard)
- [Authentication, 2FA, Session Timeout](#authentication-2fa-session-timeout)
- [RBAC](#rbac)
- [System Settings (Referensi)](#system-settings-referensi)
- [Identifikasi Aset (QR/RFID/NFC)](#identifikasi-aset-qrrfidnfc)
- [Transaksi & Approval Workflow](#transaksi--approval-workflow)
- [Maintenance & Read-only Mode](#maintenance--read-only-mode)
- [Logging & Audit Trail](#logging--audit-trail)
- [Import/Export & Bulk Data](#importexport--bulk-data)
- [Laporan (Excel/PDF)](#laporan-excelpdf)
- [Integrasi API & Webhook](#integrasi-api--webhook)
- [Notifikasi](#notifikasi)
- [Public Asset View (QR Scan)](#public-asset-view-qr-scan)
- [Queues & Kinerja](#queues--kinerja)
- [Testing](#testing)
- [Deployment Checklist](#deployment-checklist)

## Arsitektur Ringkas
- **Laravel** + template **Vyzor (Bootstrap)**.
- **Service-first**: logic domain di `app/Services/*`, controller tipis.
- **UUID** sebagai primary key (role/permission juga sudah di-custom untuk UUID).
- **Settings** berbasis DB di tabel `settings`, dibaca via `App\Services\System\SystemSettingService`.
- **Log** ke file khusus channel `asset_activity` (bukan DB).

## Alur Penggunaan
1. Buka aplikasi; jika DB belum siap, otomatis redirect ke **/setup**.
2. Jalankan wizard:
   - Step DB: migrate + seed minimal/full.
   - Step 1: buat admin.
   - Step 2: isi nilai setting (form dari data di DB).
   - Step 3: generate master data dasar.
   - Step 4: buat aset sample (opsional).
3. Login ke dashboard (`/dashboard/index`), cek ringkasan di dashboard.
4. Kelola master data (status, kelas, kategori, lokasi, PIC, dsb.).
5. Input aset + foto, QR otomatis di-generate jika diaktifkan.
6. Jalankan transaksi (movement, disposal, maintenance, audit) sesuai izin.
7. Approval (jika workflow pending) dikerjakan di menu **Approvals**.
8. Export laporan (Excel/PDF) atau lakukan import massal jika perlu.

## Setup & Wizard
- **Route**: `GET /setup`, `POST /setup`, `POST /setup/migrate`.
- Bila koneksi DB gagal → tampilkan panduan isi `.env` + tombol migrate (minimal/full seed).
- Wizard langkah 1–4 (admin, setting, master, aset sample).
- Middleware `EnsureDatabaseReady` mencegah akses normal sebelum DB siap.

## Authentication, 2FA, Session Timeout
- Login: `/login`, Register: `/register`, Logout: `POST /logout`.
- **2FA**: setelah password benar, user yang aktifkan 2FA akan diminta kode 6 digit di `/two-factor-challenge`.
- **Session timeout**: middleware `session.timeout` memakai setting `security.session_idle_minutes`.

## RBAC
- Paket `spatie/laravel-permission` dengan UUID (lihat `config/permission.php`).
- Permissions utama: `settings.manage`, `users.manage`, `roles.manage`, `permissions.manage`, `assets.view`, `assets.manage`, `movements.manage`, `disposals.manage`, `audits.manage`, `maintenance.manage`, `reports.view`, `approvals.manage`.
- Role seed: `super-admin`, `asset-manager`, `auditor`, `maintenance`, `viewer`.
- Scoping data aset: `Asset::forUser($user)` membatasi berdasar departemen/lokasi kecuali user punya `assets.view_all`.

## System Settings (Referensi)
Semua ada di tabel `settings` (seeded oleh `SettingSeeder`). Contoh kunci penting:
- **Aplikasi/UI**: `application.name`, `application.timezone`, `ui.date_format`, `ui.time_format`, `ui.table_page_size`.
- **Aset & Identifikasi**: `asset.code_prefix`, `asset.qr_enabled`, `asset.qr_format`, `asset.qr_size`, `asset.rfid_enabled`, `asset.nfc_enabled`, `asset.rfid_auto_generate`, `asset.nfc_auto_generate`, `asset.warranty_reminder_days`.
- **Workflow**: `asset.workflow.auto_approve_movement|disposal|maintenance`.
- **Import**: `asset.import_max_rows`, `asset.import_allow_remote_images`, `asset.import_dedupe_priority`, `asset.import_default_status/category/location`.
- **Retensi/Arsip**: `asset.archive_retention_days`, `asset.soft_delete_retention_days`.
- **Security**: `security.audit_log`, `security.session_idle_minutes`, `security.two_factor_enforced`.
- **Notification**: `notification.email_enabled`, `notification.slack_webhook_url`, `notification.import_result_email`.
- **Maintenance mode**: `maintenance.readonly_mode`.
- **Integrasi**: `integration.api_key`, `integration.webhook_enabled`, `integration.webhook_url`, `integration.webhook_secret`, `integration.api_rate_limit`.

## Identifikasi Aset (QR/RFID/NFC)
- QR otomatis saat create/update aset (jika `asset.qr_enabled = true`), disimpan di `storage/app/public/qr/`, isi QR: `route('assets.public.show')`.
- RFID/NFC: field `rfid_tag`, `nfc_tag`. Bisa diwajibkan (`asset.rfid_required`, `asset.nfc_required`) dan auto-generate (`asset.rfid_auto_generate`, `asset.nfc_auto_generate`) oleh `AssetService`.

## Transaksi & Approval Workflow
- **Movement**: ubah lokasi/departemen/user; jika auto-approve OFF → status `pending` dan butuh approval.
- **Disposal**: status `approved` akan mengubah status aset ke `DISPOSED` (jika ada); bisa di-reverse.
- **Maintenance**: status awal `pending`/`planned`, lanjut `in_progress`, `completed`.
- **Audit/Stocktake**: status `matched/missing/damaged`.
- **Approval**: tersimpan di `asset_approval_requests`, dikelola via `ApprovalService`, notifikasi email ke approver & requester.
- Menu approvals: `/dashboard/approvals`.

## Maintenance & Read-only Mode
- Jika `maintenance.readonly_mode = true`, middleware `maintenance.readonly` memblok aksi tulis dan dashboard menampilkan badge peringatan.

## Logging & Audit Trail
- **Request audit**: middleware `audit.request` mencatat semua non-GET beserta durasi dan status.
- **Helper**: `asset_activity_log()`, `asset_request_log()` → channel `asset_activity` (`storage/logs/asset-activity.log`, daily).
- **ActivityLogger**: masking field sensitif (password, token) dan memotong body terlalu panjang.

## Import/Export & Bulk Data
- **Import**: modal di `/dashboard/assets`, mendukung:
  - Preview (tanpa commit) + ringkasan create/update/invalid.
  - Import langsung.
  - Gambar dari URL (jika `asset.import_allow_remote_images`) atau ZIP (`images_zip` + kolom `image_file`).
- Sample CSV: `public/samples/assets_import_sample.csv`.
- **Export**: CSV via `GET /dashboard/assets-export` (limit 2000 rows).
- Dedupe berdasarkan setting `asset.import_dedupe_priority` (code/serial).

## Laporan (Excel/PDF)
- Menu laporan: `/dashboard/reports/assets|movements|disposals|audits`.
- Export:
  - Excel multi-sheet (aset + relasi utama, dll.)
  - PDF via DomPDF.
- Filter mengikuti halaman laporan (date range, lokasi, dsb.).

## Integrasi API & Webhook
- Public API key di `integration.api_key`; middleware `VerifyApiKey` (header `X-Api-Key`).
- Webhook event aset di `App\Services\Integration\WebhookDispatcher` (respect `integration.webhook_enabled/url/secret/timeout`).
- Dokumentasi API disediakan di `GET /api-docs`.

## Notifikasi
- Email notifikasi approval: `ApprovalRequestedNotification`, `ApprovalDecisionNotification`.
- SMTP wajib dikonfigurasi di `.env` (MAIL_*). Jika `notification.email_enabled=false`, notifikasi email tidak dikirim.
- Contoh cron reminder sederhana: `php artisan asset:notify-due` (garansi akan habis, maintenance due, audit overdue) → tambahkan ke cron jika perlu.

## Public Asset View (QR Scan)
- Route: `GET /asset-view/{asset}` (tanpa login).
- Di halaman ini tersedia tombol transaksi (movement/disposal/maintenance) dalam bentuk modal jika user login & punya permission; jika tidak, hanya view data + foto aset.

## Queues & Kinerja
- Import besar dianjurkan dijalankan di queue (kini masih sinkron); arsitektur kode disiapkan agar mudah dialihkan ke job queue jika volume tinggi.
- Gunakan `php artisan queue:work` untuk job lain (notifikasi/email) jika diubah ke asynchronous.
- Pagination server-side diterapkan pada tabel besar (misal approvals, master, transaksi).
- Index DB sudah disiapkan di migrasi utama (cek migrasi masing-masing tabel).

## Testing
- Jalankan semua test:
```bash
php artisan test
```
- Test penting:
  - `tests/Feature/DashboardPageTest.php`
  - `tests/Feature/AssetTransactionFlowTest.php`
  - `tests/Feature/SystemSettingsPageTest.php`

## Deployment Checklist
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` terisi.
- Konfigurasi DB + jalankan `php artisan migrate --force`.
- `php artisan storage:link`.
- Build frontend: `npm run build` (atau gunakan artifact `public/build` yang sudah ada).
- Permission folder: `storage/` dan `bootstrap/cache/` writable.
- Set SMTP (MAIL_*), dan cron untuk queue (jika dipakai) / `asset:notify-due` (opsional).

