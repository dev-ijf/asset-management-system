# Asset Management System

![Asset Management System](public/build/assets/images/brand-logos/toggle-logo.png)

Sistem Manajemen Aset berbasis Laravel untuk pencatatan aset fisik end-to-end: **registrasi aset + identifikasi (QR/RFID/NFC), movement, disposal + reverse, maintenance, audit/stocktake, approval workflow, laporan (Excel/PDF), changelog, dan pengaturan sistem berbasis database**.

Project ini dibuat dengan fokus pada **best practice**, **clean code**, dan siap untuk dikembangkan menjadi open-source.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur Singkat](#arsitektur-singkat)
- [Kebutuhan Sistem](#kebutuhan-sistem)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Setup Wizard (First Run)](#setup-wizard-first-run)
- [Akun Default (Sample Data)](#akun-default-sample-data)
- [RBAC (Role & Permission)](#rbac-role--permission)
- [System Settings (Database-driven)](#system-settings-database-driven)
- [Identifikasi Aset (QR/RFID/NFC)](#identifikasi-aset-qrrfidnfc)
- [Transaksi Aset](#transaksi-aset)
- [Approval Workflow](#approval-workflow)
- [Authentication, 2FA, Session Timeout](#authentication-2fa-session-timeout)
- [Audit Trail & Logging](#audit-trail--logging)
- [Import/Export Aset](#importexport-aset)
- [Laporan (Excel & PDF)](#laporan-excel--pdf)
- [Landing Page & Public Asset View (QR Scan)](#landing-page--public-asset-view-qr-scan)
- [Notifikasi Email (SMTP)](#notifikasi-email-smtp)
- [Notifikasi Terjadwal (Command)](#notifikasi-terjadwal-command)
- [Maintenance Mode (Read-only)](#maintenance-mode-read-only)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)
- [Contributing](#contributing)
- [Dokumentasi Lengkap](#dokumentasi-lengkap)

## Fitur Utama

**1) User Management + RBAC (Spatie Permission)**
- Role & permission berbasis UUID
- Pembatasan akses per modul melalui middleware `permission:*`

**2) Master Data**
- Status Aset, Kelas Aset, Unit, Departemen, Person in Charge, Pengguna Aset, Kategori, Lokasi, Warranty, Vendor Contract

**3) Manajemen Aset**
- Registrasi aset dengan kode otomatis
- Foto/thumbnail aset (multi foto) tersimpan di storage
- QR code otomatis menuju halaman publik detail aset (tanpa login)
- RFID/NFC tag (opsional + bisa auto-generate via setting)
- Arsip/retensi + soft delete + restore

**4) Transaksi Aset**
- Movement (mutasi lokasi/departemen/user)
- Disposal + Reverse Disposal
- Audit/Stocktake
- Maintenance (planned/in_progress/completed + dukungan flow approval `pending`)

**5) Approval Workflow**
- Permintaan approval untuk movement/disposal/maintenance (pending/approved/rejected)
- Halaman approvals untuk approver

**6) Laporan**
- Export Excel (multi sheet) + PDF untuk aset dan transaksi
- Filter laporan (date range, lokasi, dsb.) sesuai halaman laporan

**7) Landing & Dokumentasi**
- Landing one-page untuk memperkenalkan sistem
- Public asset view untuk QR scan: `GET /asset-view/{asset}`
- Dokumentasi API internal app: `GET /api-docs`

## Arsitektur Singkat

- **Framework:** Laravel
- **Template UI:** Vyzor (Bootstrap)
- **Settings:** disimpan di tabel `settings` dan diakses melalui `App\Services\System\SystemSettingService`
- **Audit log:** file log khusus channel `asset_activity` (bukan database)
- **UUID:** hampir seluruh tabel inti menggunakan UUID sebagai primary key

Folder penting:
- `app/Services/` → business logic (tanpa repository pattern)
- `app/Http/Controllers/` → controller tipis, delegasi ke service
- `database/seeders/` → sample data
- `resources/views/` → Blade UI

## Kebutuhan Sistem

- PHP 8.2+ (sesuaikan dengan `composer.json`)
- Composer
- Node.js + NPM (Vite build)
- Database: MySQL/MariaDB (production) / SQLite (testing)
- (Opsional) Laragon untuk dev di Windows

## Quick Start (Local Development)

1) Install dependency PHP & JS
```bash
composer install
npm install
```

2) Siapkan `.env`
```bash
cp .env.example .env
php artisan key:generate
```

3) Jalankan Vite
```bash
npm run dev
```

4) Jalankan aplikasi
```bash
php artisan serve
```

5) Buat symbolic link storage (wajib untuk foto aset & QR)
```bash
php artisan storage:link
```

## Setup Wizard (First Run)

Saat aplikasi pertama kali dijalankan dan **koneksi database belum siap**, middleware akan mengarahkan ke wizard:
- `GET /setup`

Wizard terdiri dari 2 tahap besar:

1) **Database Setup**
- Aplikasi akan menampilkan panduan mengisi `.env` (DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
- Tombol migrasi tersedia:
  - `Migrate & Seed Minimal (RBAC)` → seed `RbacSeeder` + `SettingSeeder`
  - `Migrate + Sample Data (Full Seed)` → seed `DatabaseSeeder`

2) **Wizard Aplikasi (4 langkah)**
- Step 1: buat user admin
- Step 2: isi nilai setting (form dibentuk dari data di tabel `settings`)
- Step 3: buat master data dasar
- Step 4: buat aset pertama (sample)

## Akun Default (Sample Data)

Jika memilih **Full Seed**, akun admin default dibuat oleh `database/seeders/RbacSeeder.php`:
- Email: `admin@example.com`
- Password: `password123`

## RBAC (Role & Permission)

RBAC memakai `spatie/laravel-permission` yang sudah disesuaikan untuk UUID:
- Primary key role/permission: `uuid`
- Pivot model: `model_uuid` (lihat `config/permission.php`)

Permission dasar (seed):
- `settings.manage`
- `users.manage`, `roles.manage`, `permissions.manage`
- `assets.view`, `assets.manage`
- `movements.manage`, `disposals.manage`, `audits.manage`, `maintenance.manage`
- `reports.view`, `approvals.manage`

Role dasar (seed):
- `super-admin`, `asset-manager`, `auditor`, `maintenance`, `viewer`

Catatan scoping data:
- Model `Asset` memiliki `scopeForUser()` dan `isVisibleTo()` untuk pembatasan berbasis departemen/lokasi.
- (Opsional) Permission `assets.view_all` dapat ditambahkan untuk bypass scoping (lihat `app/Models/Asset.php`).

## System Settings (Database-driven)

Setting disimpan di tabel `settings` dan dapat dikelola lewat:
- Dashboard: `GET /dashboard/settings`
- Setup Wizard step 2: `GET /setup?step=2`

Setting dibaca via `App\Services\System\SystemSettingService`:
- Default berasal dari `config/system.php`
- Nilai DB akan override default

Contoh setting penting (lihat `database/seeders/SettingSeeder.php`):
- `asset.code_prefix`, `asset.qr_enabled`, `asset.qr_format`, `asset.qr_size`
- `asset.rfid_enabled`, `asset.nfc_enabled`, `asset.rfid_auto_generate`, `asset.nfc_auto_generate`
- `maintenance.readonly_mode`
- `security.audit_log`, `security.session_idle_minutes`, `security.two_factor_enforced`
- `integration.api_key`, `integration.webhook_*`
- `asset.import_*` (import limit/dedupe/default lookup)

## Identifikasi Aset (QR/RFID/NFC)

**QR Code**
- Dibuat otomatis saat aset dibuat/di-update (jika `asset.qr_enabled = true`)
- Tersimpan di `storage/app/public/qr/`
- Isi QR mengarah ke public asset view: `route('assets.public.show')` (`/asset-view/{asset}`)

**RFID/NFC**
- Disimpan sebagai `rfid_tag` dan `nfc_tag` di tabel `assets`
- Bisa diwajibkan (`asset.rfid_required` / `asset.nfc_required`) dan/atau auto-generate (`asset.rfid_auto_generate` / `asset.nfc_auto_generate`) oleh `AssetService`.

## Transaksi Aset

1) **Movement**
- Membuat record `asset_movements`
- Jika auto-approve aktif, aset akan ikut berubah: lokasi/departemen/user

2) **Disposal**
- Membuat record `asset_disposals`
- Jika approved, aset diarahkan ke status `DISPOSED` (jika status ini ada)
- Reverse disposal mengembalikan status/lokasi/departemen sebelumnya

3) **Audit/Stocktake**
- Membuat record `asset_audits` (matched/missing/damaged)

4) **Maintenance**
- Membuat record `asset_maintenances`
- Flow status: `pending` (menunggu approval) → `planned` → `in_progress` → `completed`

## Approval Workflow

Approval disimpan di tabel `asset_approval_requests` (morph ke movement/disposal/maintenance):
- Status: `pending`, `approved`, `rejected`

Halaman approvals:
- `GET /dashboard/approvals` (butuh permission `approvals.manage`)

## Authentication, 2FA, Session Timeout

**Login/Register**
- Login: `GET /login` / `POST /login`
- Register: `GET /register` / `POST /register`
- Logout: `POST /logout`

**2FA (TOTP 6 digit)**
- User dapat mengaktifkan 2FA dari menu profile:
  - `GET /dashboard/profile`
- Flow login:
  - Jika `two_factor_enabled = true`, setelah password benar user akan diarahkan ke:
    - `GET /two-factor-challenge`
  - User memasukkan 6 digit dari aplikasi authenticator (Google Authenticator/1Password/Authy) melalui:
    - `POST /two-factor-challenge`

**Session Timeout (idle timeout)**
- Middleware `session.timeout` memaksa logout ketika tidak ada aktivitas selama X menit.
- Setting terkait:
  - `security.session_idle_minutes`

## Audit Trail & Logging

**1) Request Audit (End-to-end)**
- Middleware `audit.request` mencatat request non-GET beserta durasi response.
- Disimpan via `ActivityLogger::audit()`.

**2) Log Aktivitas Domain**
- Helper:
  - `asset_activity_log(...)`
  - `asset_request_log(...)`
- Service: `app/Services/Logging/ActivityLogger.php`

**Output log**
- Channel: `asset_activity`
- Lokasi: `storage/logs/asset-activity.log` (daily rotation)
- ENV yang relevan:
  - `ASSET_LOG_FILE`, `ASSET_LOG_LEVEL`, `ASSET_LOG_DAYS`

## Import/Export Aset

**Import**
- UI import ada di halaman daftar aset (`/dashboard/assets`)
- Mendukung:
  - `Preview` (tanpa menyimpan) + ringkasan create/update/invalid
  - `Import` langsung (create/update)
  - Gambar dari:
    - URL (`image_url`) *(jika `asset.import_allow_remote_images = true`)*
    - ZIP upload (`images_zip`) dengan mapping nama file (`image_file`)

Sample file import tersedia:
- `public/samples/assets_import_sample.csv`

**Export**
- CSV export (limit 2000 rows) tersedia via route:
  - `GET /dashboard/assets-export`

## Laporan (Excel & PDF)

Menu laporan:
- `GET /dashboard/reports/assets`
- `GET /dashboard/reports/movements`
- `GET /dashboard/reports/disposals`
- `GET /dashboard/reports/audits`

Export:
- Excel: multi-sheet (termasuk relasi utama)
- PDF: layout khusus report

## Landing Page & Public Asset View (QR Scan)

Landing:
- `GET /` atau `GET /landing`

Public asset view (tanpa login):
- `GET /asset-view/{asset}`

Transaksi dari halaman public (wajib login + permission terkait):
- Movement: `POST /asset-view/{asset}/movement`
- Disposal: `POST /asset-view/{asset}/disposal`
- Maintenance: `POST /asset-view/{asset}/maintenance`

## Notifikasi Email (SMTP)

Notifikasi saat approval menggunakan **Laravel Notifications** (channel `mail`):
- Approver menerima email “approval requested”
- Requester menerima email “approval approved/rejected”

Agar email terkirim, konfigurasi SMTP pada `.env` (contoh):
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@example.com"
MAIL_FROM_NAME="Asset Management System"
```

## Notifikasi Terjadwal (Command)

Tersedia command untuk reminder sederhana (mencatat ke log `asset_activity`):
```bash
php artisan asset:notify-due
```

Anda bisa menjadwalkannya via cron (contoh setiap hari jam 08:00):
```cron
0 8 * * * cd /path/to/project && php artisan asset:notify-due >> /dev/null 2>&1
```

## Maintenance Mode (Read-only)

Jika setting `maintenance.readonly_mode = true`:
- Middleware `maintenance.readonly` akan memblokir aksi tulis.
- Dashboard menampilkan badge “Mode Read-only Aktif”.

## Testing

Menjalankan test (SQLite):
```bash
php artisan test
```

## Deployment Notes

Checklist singkat production:
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` sudah terisi
- `php artisan migrate --force`
- `php artisan storage:link`
- `npm run build` (atau gunakan build artifact yang sudah ada di `public/build`)
- Pastikan permission folder:
  - `storage/` dan `bootstrap/cache/` writable

## Contributing

Kontribusi sangat diterima.
- Gunakan style & struktur yang sudah ada (controller tipis, logic di service)
- Tambahkan test untuk fitur baru bila memungkinkan
- Buat PR kecil dan fokus per fitur

## Dokumentasi Lengkap

Dokumentasi teknis terperinci (alur, setting, workflow, integrasi, notifikasi, dsb.) tersedia di:
- `documentation/guide.md`
