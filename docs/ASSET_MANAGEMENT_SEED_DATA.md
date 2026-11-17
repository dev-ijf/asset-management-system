# Sample Seed Data Asset Management System

Dokumen ini merangkum data awal yang benar-benar dibuat oleh `prisma/seed.mjs`. ID menggunakan UUID yang dihasilkan database sehingga nilainya berbeda pada setiap environment.

## Permission

| Nama |
|---|
| settings.manage |
| users.manage |
| roles.manage |
| permissions.manage |
| assets.view |
| assets.manage |
| movements.manage |
| disposals.manage |
| audits.manage |
| maintenance.manage |
| reports.view |
| approvals.manage |

## Role dan Permission

| Role | Permission |
|---|---|
| super-admin | Seluruh permission di atas |
| asset-manager | assets.view, assets.manage, movements.manage, disposals.manage, maintenance.manage, audits.manage, reports.view, approvals.manage |
| auditor | assets.view, audits.manage, reports.view |
| maintenance | assets.view, maintenance.manage, movements.manage, reports.view |
| viewer | assets.view, reports.view |

## Pengguna Awal

| Nama | Email | Role | Password |
|---|---|---|---|
| Administrator | admin@example.com | super-admin | Nilai `SEED_ADMIN_PASSWORD`; fallback implementasi adalah `password123` |

Untuk keamanan, environment produksi harus selalu mengisi `SEED_ADMIN_PASSWORD` dan mengganti kredensial awal sebelum sistem digunakan.

## Asset Status

| Code | Nama | Deskripsi |
|---|---|---|
| ACTIVE | Aktif | Aset siap digunakan |
| MAINT | Maintenance | Dalam perawatan |
| BROKEN | Rusak | Butuh perbaikan/hasil inspeksi |
| DISPOSED | Disposed | Aset sudah didisposal melalui approval (status sistem) |

## Asset Class

| Code | Nama | Deskripsi |
|---|---|---|
| ELEC | Elektronik | Laptop, server, dan perangkat elektronik |
| FURN | Furniture | Meja, kursi, dan lemari |

## Unit

| Symbol | Nama | Deskripsi |
|---|---|---|
| pcs | Pieces | Satuan unit umum |
| kg | Kilogram | Satuan berat |

## Department

| Code | Nama | Deskripsi |
|---|---|---|
| IT | IT | Departemen Teknologi |
| FIN | Keuangan | Departemen Finance |

## Person in Charge

| Nama | Email | Telepon | Catatan |
|---|---|---|---|
| Andi Saputra | andi@example.com | 08123456789 | Supervisor IT |

## Asset User

| Nama | Email | Telepon | Department | Catatan |
|---|---|---|---|---|
| Budi Santoso | budi@example.com | 0811111111 | IT | Pengguna laptop |

## Asset Category

| Code | Nama | Parent | Deskripsi |
|---|---|---|---|
| OFFICE | Peralatan Kantor | - | Kategori umum peralatan kantor |
| LAPTOP | Laptop | OFFICE | Perangkat laptop |

## Asset Location

| Code | Nama | Parent | Deskripsi |
|---|---|---|---|
| WH-01 | Gudang Pusat | - | Gudang utama |
| FL-02 | Lantai 2 | WH-01 | Area kantor lantai 2 |

## Warranty

| Nama | Durasi | Catatan |
|---|---:|---|
| Garansi 1 Tahun | 12 bulan | Vendor default |
| Garansi 3 Tahun | 36 bulan | Perangkat premium |

## Vendor Contract

| Vendor | Contract Number | SLA Response | SLA Resolution | Catatan |
|---|---|---:|---:|---|
| PT Vendor Teknologi | VC-IT-001 | 8 jam | 48 jam | Kontrak dummy untuk seed awal |

## Asset Contoh

| Field | Nilai |
|---|---|
| Code | AST-0001 |
| Name | Laptop Operasional |
| Serial Number | SN-SEED-0001 |
| Description | Aset dummy untuk verifikasi relasi awal |
| Status | ACTIVE |
| Class | ELEC |
| Category | LAPTOP |
| Unit | pcs |
| Department | IT |
| PIC | Andi Saputra |
| Asset User | Budi Santoso |
| Location | FL-02 |
| Warranty | Garansi 1 Tahun |
| Vendor Contract | VC-IT-001 |
| Cost | 15.000.000,00 |
| Residual Value | 2.500.000,00 |
| Depreciation Method | STRAIGHT_LINE |
| Useful Life | 36 bulan |
| CAPEX/OPEX | CAPEX |
| QR Token | seed-asset-0001 |
| Metadata | `{ "source": "seed", "phase": "stage-2" }` |

## Data yang Tidak Dibuat oleh Seed

Seed saat ini tidak membuat contoh untuk movement, disposal, audit, maintenance, approval request, foto, archive, bulk job, atau history. Nilai contoh untuk tabel-tabel tersebut tidak boleh diasumsikan sebagai seed resmi.
