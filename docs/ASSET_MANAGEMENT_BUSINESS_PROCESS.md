# Proses Bisnis Asset Management System

## A. Login

```mermaid
flowchart TD
    A[Pengguna membuka Login] --> B{Pilih metode}
    B -->|Email dan password| C[Validasi akun lokal]
    B -->|Google| D[Google memverifikasi akun]
    D --> E[Cocokkan email dengan pengguna terdaftar]
    C --> F{Valid?}
    E --> F
    F -->|Ya| G[Buat sesi 8 jam]
    G --> H[Dashboard]
    F -->|Tidak| I[Tampilkan pesan kesalahan]
```

Google Login tidak membuat akun baru. Role dan permission selalu diambil dari data pengguna lokal. Logout menghapus cookie sesi.

### Lupa Password

```mermaid
flowchart TD
    A[Klik Lupa password? di halaman Login] --> B[Isi email]
    B --> C{Email terdaftar dan belum melewati batas permintaan?}
    C -->|Ya| D[Buat token sekali pakai, berlaku 60 menit]
    D --> E[Kirim tautan reset ke email]
    C -->|Tidak| F[Tidak ada email dikirim]
    E --> G[Tampilkan pesan yang sama untuk semua email]
    F --> G
    G --> H[Pengguna membuka tautan di email]
    H --> I{Token valid?}
    I -->|Tidak| J[Kembali ke Lupa Password dengan pesan kedaluwarsa]
    I -->|Ya| K[Isi password baru dan konfirmasi]
    K --> L[Simpan password, tandai token terpakai]
    L --> M[Semua sesi lama keluar otomatis]
    M --> N[Login dengan password baru]
```

Pesan setelah permintaan selalu sama agar sistem tidak membocorkan email mana yang terdaftar. Hanya hash token yang disimpan di database. Permintaan baru membatalkan token lama, dan setiap akun dibatasi maksimal 3 permintaan per 15 menit. Email dikirim lewat SMTP (`MAIL_MAILER=smtp`); di development dengan `MAIL_MAILER=log`, tautan dicetak ke console server.

## B. Tambah Asset

```mermaid
flowchart TD
    A[Buka Tambah Aset] --> B[Isi data dan upload foto wajib]
    B --> C[Validasi input dan relasi master]
    C -->|Tidak valid| D[Tampilkan kesalahan]
    C -->|Valid| E{Foto sudah diupload?}
    E -->|Tidak| D
    E -->|Ya| F[Validasi dan kompres foto]
    F --> G[Upload ke Google Drive privat]
    G --> H[Simpan aset]
    H --> I[Simpan referensi foto dan riwayat]
    I --> J[Aset tampil pada daftar aktif]
```

Foto wajib diupload; aset tidak bisa disimpan tanpa foto. Kode dan QR token harus unik. Jika penyimpanan foto gagal, aset tidak boleh menyimpan referensi file yang tidak valid. Jika penyimpanan database gagal setelah upload, sistem berusaha membersihkan file yang tidak terpakai.

## C. Edit Asset

```mermaid
flowchart TD
    A[Pilih aset] --> B[Klik Edit]
    B --> C[Ubah data atau foto]
    C --> D[Validasi]
    D -->|Gagal| E[Tampilkan kesalahan]
    D -->|Berhasil| F[Simpan perubahan]
    F --> G[Catat riwayat]
    G --> H[Bersihkan foto lama bila diganti/dihapus]
```

Foto baru diproses menjadi WebP dengan sisi terpanjang maksimal 1600 px dan kualitas sekitar 78%. Foto lama baru dijadwalkan/dihapus setelah referensi baru tersimpan.

## D. Delete Asset

```mermaid
flowchart TD
    A[Pilih aset] --> B[Klik Hapus]
    B --> C[Konfirmasi]
    C -->|Batal| D[Tidak ada perubahan]
    C -->|Hapus| E[Isi deleted_at]
    E --> F[Catat riwayat]
    F --> G[Aset hilang dari daftar aktif]
```

Delete menggunakan **soft delete**. Data aset, foto, dan riwayat tidak langsung dihapus permanen. Aset yang dihapus tampil di tab **Dihapus** pada menu Archive dan bisa dipulihkan atau dihapus permanen dari sana.

## E. Archive Asset

```mermaid
flowchart TD
    A[Aset aktif] --> B[Klik Arsipkan]
    B --> C[Isi alasan dan retensi opsional]
    C --> D[Konfirmasi]
    D -->|Setuju| E[Simpan waktu, pelaku, dan alasan]
    E --> F[Aset tampil di menu Archive]
```

Archive dipakai untuk aset yang tidak lagi aktif secara operasional tetapi masih perlu disimpan. Archive tidak sama dengan delete.

## F. Restore Asset

```mermaid
flowchart TD
    A[Buka Archive tab Diarsipkan atau Dihapus] --> B[Pilih aset]
    B --> C[Klik Pulihkan]
    C --> D[Konfirmasi]
    D -->|Setuju| E[Hapus status archive dan soft delete]
    E --> F[Simpan waktu dan pelaku restore]
    F --> G[Aset kembali ke daftar aktif]
```

Restore berlaku untuk aset yang diarsipkan maupun yang dihapus (soft delete).

### Hapus Permanen

```mermaid
flowchart TD
    A[Buka Archive] --> B[Pilih aset diarsipkan/dihapus]
    B --> C[Klik Hapus Permanen]
    C --> D[Ketik HAPUS untuk konfirmasi]
    D -->|Benar| E{Semua aset masih nonaktif?}
    E -->|Tidak| X[Ditolak, muat ulang halaman]
    E -->|Ya| F[Hapus aset beserta foto, riwayat, dan transaksi]
    F --> G[File foto di Google Drive dihapus]
    G --> H[Master data yang tidak dipakai lagi bisa dihapus]
```

Hapus permanen tidak bisa dibatalkan dan hanya untuk aset di Archive. Aset aktif harus diarsipkan atau dihapus dulu. Master data (status, kategori, lokasi, departemen, dan lainnya) tidak bisa dihapus selama masih dipakai aset mana pun, termasuk aset di Archive; pesan error menyebut jumlah aset di Archive yang perlu dihapus permanen.

## G. Import Asset

```mermaid
flowchart TD
    A[Download template] --> B[Isi data]
    B --> C[Upload XLSX/CSV]
    C --> D[Validasi file dan header]
    D --> E[Validasi master data]
    E --> F[Cek duplikat dalam file dan database]
    F --> G[Tampilkan preview]
    G --> H{Konfirmasi?}
    H -->|Tidak| I[Tidak ada perubahan database]
    H -->|Ya| J[Import baris Ready]
    J --> K[Skip baris duplikat/tidak valid]
    K --> L[Ringkasan dan error report]
```

Import bersifat parsial: baris valid diproses, sedangkan duplikat dan invalid dilewati. Kode aset lama tidak ditimpa. Nama master dari file dipetakan ke ID database; nilai yang tidak ditemukan gagal dan tidak membuat master baru.

## H. Bulk Action

```mermaid
flowchart TD
    A[Pilih checkbox aset] --> B{Pilih tindakan}
    B -->|Bulk Update| C[Download/isi template update]
    C --> D[Upload dan preview before/after]
    D --> E[Konfirmasi dan update]
    B -->|Bulk Delete| F[Preview dan konfirmasi]
    F --> G[Soft delete aset terpilih]
    E --> H[Catat hasil dan riwayat]
    G --> H
```

Select all hanya memilih data yang tampil/dimuat. Bulk update dibatasi pada aset yang dipilih saat template dibuat. Perubahan aset oleh proses lain setelah preview menyebabkan baris terkait ditolak agar data baru tidak tertimpa.

## I. Approval

```mermaid
flowchart TD
    A[Pengguna membuat request transaksi] --> B[Status PENDING]
    B --> C[Approver membuka daftar]
    C --> D{Keputusan}
    D -->|Approve| E[Jalankan transaksi]
    E --> F[Status APPROVED]
    D -->|Reject| G[Simpan catatan bila diisi]
    G --> H[Status REJECTED]
```

Jenis request yang didukung adalah movement, disposal, dan maintenance. Reviewer serta waktu review disimpan. Pencegahan self-approval tidak ditemukan secara tegas dan perlu dikonfirmasi sebelum modul digabungkan.

## J. Asset Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Aktif: Aset dibuat
    Aktif --> Diarsipkan: Archive
    Diarsipkan --> Aktif: Restore
    Aktif --> Terhapus: Soft delete
    Diarsipkan --> Terhapus: Soft delete
    Terhapus --> Aktif: Restore
    Diarsipkan --> [*]: Hapus permanen
    Terhapus --> [*]: Hapus permanen
```

Status master seperti Aktif, Maintenance, atau Rusak menggambarkan kondisi operasional. `archived_at` mengatur lifecycle arsip, sedangkan `deleted_at` mengatur soft delete; ketiganya merupakan konsep yang berbeda.

## K. Movement

Pengguna memilih aset, menentukan lokasi/department/asset user tujuan, tanggal, dan catatan. Setelah diproses, sistem menyimpan kondisi asal dan tujuan lalu memperbarui penempatan aset. Permission yang digunakan adalah `movements.manage`.

## L. Disposal

Disposal mencatat aset yang dihentikan penggunaannya beserta tanggal dan alasan. Permission yang digunakan adalah `disposals.manage`.

```mermaid
flowchart TD
    A[Ajukan disposal + alasan] --> B{Asset sudah disposal aktif<br/>atau punya request disposal pending?}
    B -->|Ya| X[Ditolak dengan pesan]
    B -->|Tidak| C[Request PENDING]
    C --> D{Approver menyetujui?}
    D -->|Tolak| R[REJECTED, asset tetap]
    D -->|Setuju| E[Cek ulang: belum ada disposal aktif]
    E --> F[Simpan status sebelum disposal saat ini<br/>lalu set status DISPOSED]
    F --> G[Disposal aktif]
    G -->|Ajukan pembatalan + alasan| P{Sudah ada pembatalan pending?}
    P -->|Ya| X2[Ditolak dengan pesan]
    P -->|Tidak| Q[Request pembatalan PENDING<br/>status tetap DISPOSED]
    Q --> S{Approver menyetujui?}
    S -->|Tolak| G
    S -->|Setuju| H[Status kembali ke status sebelum disposal<br/>atau ACTIVE bila tidak diketahui]
```

Aturan konsistensi:

- Satu asset hanya boleh punya **satu** disposal aktif dan **satu** request disposal pending.
- Setiap pengajuan, approval, dan reverse mengunci baris asset, sehingga klik ganda atau dua approver bersamaan tidak menghasilkan disposal ganda.
- Status sebelum disposal direkam saat approval, bukan saat pengajuan.
- Pembatalan (reverse) disposal wajib alasan dan harus disetujui di Approvals, sama seperti disposal. Satu asset hanya boleh punya satu pengajuan pembatalan pending. Alasan, waktu, dan approver pembatalan tersimpan di data disposal dan riwayat asset.
- Reverse hanya mengembalikan status; lokasi dan department tidak diubah karena disposal tidak mengubahnya.
- Status `DISPOSED` hanya bisa diset lewat disposal yang disetujui dan hanya bisa dilepas lewat pembatalan disposal yang disetujui. Form edit asset dan bulk import/update menolak perubahan status yang melanggar aturan ini.
- Status `ACTIVE` dan `DISPOSED` adalah status sistem: tidak bisa dihapus atau diganti kodenya di master.
- Movement yang disetujui setelah asset didisposal ditolak.
- Dropdown aset di form Disposal dan Movement tidak menampilkan aset yang sudah disposed. Form Disposal juga menyembunyikan aset yang masih punya request disposal pending.

## M. Audit dan Maintenance

Audit mencatat hasil pemeriksaan aset (`MATCH`, `MATCHED`, `MISMATCH`, `MISSING`, atau `DAMAGED`), lokasi, tanggal, auditor, dan catatan. Maintenance mencatat deskripsi pekerjaan, status, jadwal/selesai, biaya, vendor, dan pembuat. Keduanya menyimpan riwayat per aset.
