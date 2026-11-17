# Dokumentasi Fitur Asset Management System

Dokumen ini mencatat fitur yang ditemukan pada implementasi saat ini. Status **Partial** berarti sebagian alur tersedia tetapi belum lengkap. **Not Found** berarti tidak ditemukan pada implementasi saat ini.

## A. Authentication

### Login email dan password

**Tujuan:** Memverifikasi akun sebelum pengguna masuk ke dashboard.  
**Pengguna:** Pengguna yang sudah terdaftar.  
**Input:** Email dan password.  
**Proses:** Sistem mencari email, membandingkan password terenkripsi, lalu membuat sesi.  
**Output:** Pengguna masuk ke dashboard atau menerima pesan kesalahan.  
**Business Rule:** Akun harus sudah ada; password tidak disimpan sebagai teks biasa.  
**Status:** Implemented.

### Lihat atau sembunyikan password

**Tujuan:** Membantu pengguna memeriksa password yang diketik.  
**Pengguna:** Pengguna pada halaman login.  
**Input:** Klik ikon mata.  
**Proses:** Tampilan kolom berganti antara teks dan password.  
**Output:** Password ditampilkan atau disembunyikan.  
**Business Rule:** Nilai password tidak dikirim sampai form disubmit.  
**Status:** Implemented.

### Sign in with Google

**Tujuan:** Menyediakan cara login melalui akun Google.  
**Pengguna:** Pengguna yang emailnya sudah terdaftar di sistem.  
**Input:** Akun Google.  
**Proses:** Google memverifikasi akun; sistem mencocokkan email terverifikasi dengan tabel pengguna dan membuat sesi lokal.  
**Output:** Dashboard atau pesan bahwa akun belum terdaftar/konfigurasi tidak tersedia.  
**Business Rule:** Tidak membuat pengguna baru otomatis; role dan permission tetap berasal dari sistem.  
**Status:** Implemented.

### Session dan logout

**Tujuan:** Menjaga status login dan mengakhiri akses pengguna.  
**Pengguna:** Pengguna yang sudah login.  
**Input:** Cookie sesi; klik logout untuk mengakhirinya.  
**Proses:** Sesi bertanda tangan diperiksa pada area dashboard dan cookie dihapus saat logout.  
**Output:** Akses dashboard atau kembali ke login.  
**Business Rule:** Masa sesi saat ini 8 jam. Opsi "Ingat saya" tampil tetapi belum memperpanjang masa sesi.  
**Status:** Implemented; "Ingat saya" Partial.

### Lupa password dan autentikasi dua faktor

**Tujuan:** Pemulihan akun dan keamanan tambahan.  
**Pengguna:** Pengguna sistem.  
**Input/Proses/Output:** Tidak ditemukan pada implementasi saat ini. Tautan lupa password dan field 2FA ada, tetapi tidak ditemukan alur pemulihan atau verifikasi 2FA yang lengkap.  
**Business Rule:** Perlu dikonfirmasi.  
**Status:** Not Found.

## B. User Management

### Daftar, tambah, edit, dan hapus pengguna

**Tujuan:** Mengelola akun yang boleh memakai sistem.  
**Pengguna:** Pengguna dengan permission `users.manage`.  
**Input:** Nama, email, password, department, lokasi, serta role/permission terkait.  
**Proses:** Sistem memvalidasi input lalu menyimpan perubahan pengguna.  
**Output:** Daftar pengguna yang diperbarui.  
**Business Rule:** Email unik; password disimpan dalam bentuk hash; akses dibatasi permission.  
**Status:** Implemented.

### Role dan permission

**Tujuan:** Mengatur hak akses berdasarkan peran dan izin langsung.  
**Pengguna:** Pengguna dengan permission pengelolaan role/permission.  
**Input:** Role, permission, dan penugasan kepada pengguna.  
**Proses:** Permission role dan permission langsung digabung untuk menentukan akses efektif.  
**Output:** Hak akses pengguna.  
**Business Rule:** Role dan permission memiliki pasangan nama dan guard yang unik.  
**Status:** Implemented.

## C. Asset Management

### Daftar, pencarian, filter, sorting, dan pagination aset

**Tujuan:** Menemukan dan meninjau aset aktif.  
**Pengguna:** Pengguna dengan `assets.view`.  
**Input:** Kata pencarian, filter master data, urutan, halaman, dan jumlah baris.  
**Proses:** Sistem menyaring aset yang belum diarsipkan dan belum dihapus.  
**Output:** Tabel aset dan total hasil.  
**Business Rule:** Pagination menggunakan 10/25/50/100 baris; perubahan pencarian/filter mengembalikan halaman ke awal.  
**Status:** Implemented.

### Tambah aset

**Tujuan:** Mendaftarkan aset baru.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Data dasar, klasifikasi, penempatan, finansial, identitas, serta foto aset (wajib).  
**Proses:** Sistem memvalidasi data, membuat kode dan QR token bila diperlukan, menyimpan aset, foto, serta riwayat.  
**Output:** Aset baru.  
**Business Rule:** Foto wajib diupload; kode unik; QR token unik; relasi master bersifat opsional sesuai schema; status kosong dapat memakai status ACTIVE.  
**Status:** Implemented.

### Detail dan riwayat aset

**Tujuan:** Menampilkan profil aset, foto, QR, relasi, dan perubahan yang tercatat.  
**Pengguna:** Pengguna dengan `assets.view`; halaman QR publik menggunakan token aset.  
**Input:** ID atau QR token aset.  
**Proses:** Sistem mengambil data aset dan relasinya.  
**Output:** Detail aset dan riwayat.  
**Business Rule:** Foto privat hanya dialirkan kepada pengguna terautentikasi dengan izin melihat aset.  
**Status:** Implemented.

### Edit aset dan foto

**Tujuan:** Memperbarui data atau mengganti/menghapus foto aset.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Nilai perubahan dan foto pengganti (wajib bila aset belum punya foto atau foto lama dihapus).  
**Proses:** Sistem memvalidasi, menyimpan perubahan, mencatat riwayat, dan mengelola file foto lama.  
**Output:** Aset yang diperbarui.  
**Business Rule:** Aset wajib memiliki minimal satu foto; foto terakhir tidak bisa dihapus tanpa pengganti. Foto maksimal 10 MB dan hanya JPG/JPEG/PNG/WebP; diproses menjadi WebP maksimal 1600 px.  
**Status:** Implemented.

### Hapus aset

**Tujuan:** Mengeluarkan aset dari daftar aktif tanpa menghilangkan catatan langsung.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Aset dan konfirmasi.  
**Proses:** Sistem mengisi `deleted_at` dan mencatat riwayat.  
**Output:** Aset tidak tampil pada daftar aktif.  
**Business Rule:** Menggunakan soft delete; foto dan riwayat tetap tersimpan. Pemulihan khusus aset yang sudah dihapus tidak ditemukan.  
**Status:** Implemented; restore soft-delete Not Found.

### Arsipkan dan pulihkan aset

**Tujuan:** Memindahkan aset dari daftar operasional ke arsip dan mengembalikannya.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Aset, alasan arsip, tanggal retensi opsional, dan konfirmasi.  
**Proses:** Sistem mencatat waktu/pelaku/alasan arsip atau waktu/pelaku pemulihan.  
**Output:** Aset masuk ke daftar arsip atau kembali ke daftar aktif.  
**Business Rule:** Arsip berbeda dari soft delete. Aset terhapus tidak dipulihkan melalui menu arsip.  
**Status:** Implemented.

## D. Master Data

### Status, class, unit, department, PIC, asset user, category, location, warranty, dan vendor contract

**Tujuan:** Menyediakan pilihan terstruktur bagi data aset dan transaksi.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Nama/kode dan atribut master terkait.  
**Proses:** Sistem menjalankan tambah, edit, dan hapus sesuai master yang dipilih.  
**Output:** Data referensi yang dapat dipakai oleh aset dan template import.  
**Business Rule:** Code/symbol tertentu unik; category dan location mendukung hierarki; data yang masih berelasi mengikuti aturan database. Tidak ditemukan field aktif/nonaktif pada master tersebut.  
**Status:** Implemented.

## E. Import

### Download template import/update

**Tujuan:** Menyediakan format Excel yang sesuai data sistem.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Jenis template dan, untuk update, aset terpilih.  
**Proses:** Sistem mengambil master data terbaru lalu membangun sheet input, Reference Data, dan Instructions beserta dropdown.  
**Output:** File XLSX.  
**Business Rule:** Dropdown berasal dari database; template yang sudah diunduh merupakan snapshot.  
**Status:** Implemented.

### Preview, validasi, duplicate detection, konfirmasi, dan hasil import

**Tujuan:** Mengimpor aset secara parsial dengan aman.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** XLSX atau CSV.  
**Proses:** Sistem memeriksa file/header/formula/master, mendeteksi kode atau serial duplikat, menyimpan preview sementara, lalu hanya memproses baris Ready setelah konfirmasi.  
**Output:** Ringkasan berhasil, duplikat, gagal, dan `Import_Result.xlsx`.  
**Business Rule:** Tidak menimpa aset lama; kode unik; serial tidak boleh duplikat dalam bulk import; maksimal 200 baris dan 2 MB upload; preview kedaluwarsa setelah 30 menit.  
**Status:** Implemented.

## F. Bulk Action

### Checkbox dan select all

**Tujuan:** Memilih beberapa aset pada daftar.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Checkbox baris atau header.  
**Proses:** Sistem menyimpan pilihan yang terlihat.  
**Output:** Jumlah aset terpilih dan action yang aktif.  
**Business Rule:** Select all terbatas pada data yang tampil/dimuat, bukan seluruh database.  
**Status:** Implemented.

### Bulk update dan bulk delete

**Tujuan:** Mengubah atau menghapus banyak aset.  
**Pengguna:** Pengguna dengan `assets.manage`.  
**Input:** Aset terpilih; file update untuk bulk update; konfirmasi untuk delete.  
**Proses:** Update melalui preview before/after; delete mengisi `deleted_at`; keduanya memeriksa perubahan bersamaan dan mencatat riwayat.  
**Output:** Hasil per baris.  
**Business Rule:** Update hanya berlaku pada pilihan awal; Asset Code menjadi identifier dan tidak diganti; delete adalah soft delete.  
**Status:** Implemented.

### Bulk archive dan bulk restore

**Tujuan/Input/Proses/Output:** Tidak ditemukan pada implementasi saat ini; archive dan restore dilakukan per aset.  
**Business Rule:** Perlu dikonfirmasi.  
**Status:** Not Found.

## G. Archive

### Daftar arsip, restore, dan metadata arsip

**Tujuan:** Meninjau aset nonaktif yang sengaja diarsipkan dan mengaktifkannya kembali.  
**Pengguna:** Pengguna dengan akses aset; perubahan memerlukan `assets.manage`.  
**Input:** Pencarian/filter arsip, aset, alasan, retensi, dan konfirmasi.  
**Proses:** Daftar hanya memuat `archived_at` yang terisi dan `deleted_at` kosong; restore menghapus status arsip serta mencatat pelaku/waktu pemulihan.  
**Output:** Daftar arsip atau aset aktif kembali.  
**Business Rule:** Alasan, tanggal, dan pelaku arsip disimpan; tersedia export arsip.  
**Status:** Implemented.

## H. Approval

### Submit, pending, approve, reject, dan history

**Tujuan:** Meminta persetujuan untuk movement, disposal, atau maintenance.  
**Pengguna:** Pemohon sesuai permission transaksi dan approver dengan `approvals.manage`.  
**Input:** Jenis transaksi, aset, payload transaksi, keputusan, dan catatan reject opsional.  
**Proses:** Request disimpan sebagai PENDING; approver menyetujui atau menolak; approval menyimpan reviewer dan waktu review.  
**Output:** Status APPROVED/REJECTED dan transaksi dijalankan bila disetujui.  
**Business Rule:** Tidak ditemukan pencegahan self-approval yang tegas; catatan penolakan opsional; perlu dikonfirmasi sebelum integrasi.  
**Status:** Implemented dengan catatan kontrol Partial.

## I. Notification

### Feedback sukses, error, warning, loading, dan konfirmasi

**Tujuan:** Memberi respons yang jelas terhadap tindakan pengguna.  
**Pengguna:** Semua pengguna.  
**Input:** Hasil operasi atau tindakan berisiko.  
**Proses:** Sistem menampilkan toast/pesan form, status loading, dan dialog konfirmasi untuk tindakan tertentu.  
**Output:** Pesan yang dapat dibaca pengguna.  
**Business Rule:** Operasi hapus/archive/restore yang tersedia meminta konfirmasi.  
**Status:** Implemented, dengan variasi pesan mengikuti masing-masing modul.

## J. Transactions, Report, dan Export

### Movement, disposal, audit, dan maintenance

**Tujuan:** Mencatat perpindahan, penghapusan operasional, pemeriksaan, dan perawatan aset.  
**Pengguna:** Pengguna dengan permission modul terkait.  
**Input:** Aset dan data transaksi.  
**Proses:** Sistem menyimpan transaksi; movement memperbarui lokasi/department/user, disposal menyimpan kondisi sebelumnya dan dapat dibalik, audit mencatat hasil pemeriksaan, maintenance mencatat pekerjaan dan biaya.  
**Output:** Riwayat transaksi dan kondisi aset terbaru.  
**Business Rule:** Permission terpisah per modul; sebagian transaksi dapat melalui approval.  
**Status:** Implemented.

### Laporan, export, QR label, dan chart

**Tujuan:** Menyajikan dan mengunduh informasi aset/transaksi.  
**Pengguna:** Pengguna dengan `reports.view`.  
**Input:** Jenis laporan dan filter.  
**Proses:** Sistem mengambil data yang diizinkan lalu menghasilkan tampilan atau file.  
**Output:** Laporan aset, movement, disposal, audit, Excel/PDF, QR labels, dan chart.  
**Business Rule:** Export tidak dibatasi oleh pagination tampilan ketika alur export meminta seluruh dataset yang diizinkan.  
**Status:** Implemented.
