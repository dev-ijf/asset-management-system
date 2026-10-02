# Foto Asset privat di My Drive

## Analisis struktur dan perubahan

Frontend aktif: React 19, Next.js 15 App Router, Tailwind dan komponen UI internal. Backend aktif: Next.js Server Actions, Route Handlers Node.js. Repository masih mengandung Laravel, tetapi form asset yang berjalan di port 3000 memakai Next.js. Database: PostgreSQL dengan Prisma 7.

`Asset` berelasi satu-ke-banyak dengan `AssetPhoto` (`asset_photos`). Create/update memakai transaksi Prisma plus histori asset. Authorization memakai `assets.manage` untuk mutasi dan `assets.view` untuk membaca foto, sama dengan halaman asset yang ada. Session HMAC dalam cookie HttpOnly `ams_session`; role/permission berasal dari database. Tidak ada perubahan sistem login atau penambahan akses dari Google.

Mekanisme lama mengunggah foto di halaman detail ke folder publik lokal, tanpa kompresi. Integrasi Google sebelumnya hanya OAuth login, bukan Drive. Upload baru pada form tambah/edit dan galeri detail kini menggunakan Drive privat. Foto lokal lama tetap dapat digunakan; **file lama yang sudah publik tidak otomatis dipindahkan/dijadikan privat**. Migrasi file lama merupakan pekerjaan terpisah agar tidak memutus referensi/data existing.

File diubah:
- `prisma/schema.prisma`
- `.env.example`, `next.config.ts`, `package.json`, `package-lock.json`
- `src/app/(dashboard)/dashboard/assets/actions.ts`
- `src/app/(dashboard)/dashboard/assets/photo-actions.ts`
- `src/app/(dashboard)/dashboard/assets/page.tsx`
- `src/app/(dashboard)/dashboard/assets/[id]/page.tsx`
- `src/components/assets/asset-form-client.tsx`
- `src/components/assets/asset-photo-section.tsx`

File baru:
- `prisma/migrations/20260929090000_asset_photos_drive/migration.sql`
- `src/lib/asset-image.ts`, `src/lib/google-drive.ts`, `src/lib/asset-photo-storage.ts`
- `src/components/assets/asset-photo-field.tsx`
- `src/app/api/assets/[id]/photos/[photoId]/route.ts`
- `scripts/setup-drive-storage.ts`, `scripts/cleanup-drive-photos.ts`, `scripts/asset-photos.test.mjs`
- `eslint.asset-photos.config.mjs` dan dokumen ini.

## Database dan lifecycle

Kolom nullable baru pada `asset_photos`: `drive_file_id` (unik), `filename`, `mime_type`, `size` (byte setelah kompresi). Kolom `path` yang sudah ada berisi URL internal untuk foto Drive; foto lama tetap memakai path sebelumnya. Database tidak menyimpan binary/base64 gambar.

Tabel `drive_photo_cleanup` menyimpan pekerjaan pembersihan, bukan gambar. Sebelum upload, aplikasi memperoleh ID Drive dan mencatat kompensasi tertunda 24 jam. Setelah asset/foto berhasil di-commit, pekerjaan itu dihapus dalam transaksi yang sama. Bila proses mati atau hasil upload tidak pasti, pekerjaan tetap tersedia. Bila database gagal setelah upload selesai, file dicoba dihapus segera; kegagalan diantrekan ulang.

Edit mengganti/menghapus foto utama yang terlihat di form, sambil mempertahankan foto galeri lainnya. File lama dihapus **setelah** commit; ID foto dicek terhadap asset untuk mencegah penghapusan foto asset lain. Mutasi foto diserialkan melalui update baris asset. Jika foto sudah diganti oleh proses lain, pengguna diminta membuka ulang form.

Delete Asset yang ada adalah soft delete; foto tetap ada agar restore memungkinkan. Aplikasi tidak memiliki alur hard delete asset aktif, sehingga tidak ditambahkan hard delete baru. Jika kelak dibuat, antrekan seluruh ID Drive dalam transaksi sebelum menghapus asset; cascade database saja tidak menghapus file Drive.

Jalankan worker cleanup berkala (misalnya tiap 5 menit lewat Task Scheduler pada Windows atau scheduler server):

```powershell
npx tsx scripts/cleanup-drive-photos.ts
```

Jalankan dari root project dengan `.env` yang sama. Setiap eksekusi memproses maksimal 10 job jatuh tempo, mengembalikan jumlah `processed`/`failed`, dan menjadwalkan ulang kegagalan 5 menit kemudian. File yang masih direferensikan asset, termasuk soft-deleted, tidak dihapus. Worker belum dijadwalkan otomatis oleh implementasi ini; administrator perlu mengaktifkannya. Tanpa worker, kegagalan jaringan/crash bisa meninggalkan file pending cleanup.

## Validasi dan kompresi

Library: `sharp@0.34.5`, yang sebelumnya tersedia melalui Next.js dan sekarang menjadi dependency langsung. `google-auth-library` menangani OAuth storage di backend.

- Input JPG/JPEG/PNG/WebP, maksimum 10 MiB, non-animasi, maksimum 40 megapiksel.
- Backend memeriksa ekstensi/MIME, decoder gambar dan kerusakan file; tidak hanya mempercayai MIME browser.
- Auto-orientation dari EXIF, resize proporsional sisi terpanjang 1600px, tanpa upscale.
- Output WebP quality 78; metadata EXIF dibuang oleh default Sharp.
- Nama aman `{assetCode}-{UUID}.webp`, tidak memakai nama file upload pengguna.
- Batas body Server Action 12 MB untuk menampung file 10 MB dan field form. Payload lebih besar dari 12 MB ditolak Next.js sebelum action berjalan; aplikasi membatasi satu file 10 MB.

## Credential My Drive pribadi

Gunakan OAuth akun pemilik storage, **bukan service account**. Service account tidak punya kuota penyimpanan My Drive untuk memiliki file. Credential ini terpisah dari Google Sign In pengguna.

1. Pilih project di Google Cloud Console. Buka **APIs & Services → Library**, cari **Google Drive API**, klik **Enable**.
2. Buka **Google Auth Platform**. Atur Branding dan Audience. Untuk Gmail pribadi gunakan audience External; bila Testing, tambahkan email pemilik storage ke Test users. Project Internal organisasi mungkin tidak mengizinkan akun Gmail pribadi.
3. Tambahkan scope `https://www.googleapis.com/auth/drive.file` pada Data Access. Scope ini mengakses file/folder yang dibuat atau diotorisasi untuk aplikasi, bukan seluruh My Drive.
4. Buat OAuth Client baru bertipe **Web application**, misalnya `Asset Management Drive Storage`.
5. Untuk memperoleh refresh token melalui OAuth Playground, tambahkan Authorized redirect URI:
   `https://developers.google.com/oauthplayground`
   Ini khusus setup storage; jangan mengganti callback login `/api/auth/google/callback`.
6. Buka https://developers.google.com/oauthplayground . Klik roda gigi → **Use your own OAuth credentials**, isi Client ID/Secret client storage. Gunakan OAuth flow server-side dan access type Offline.
7. Masukkan scope `https://www.googleapis.com/auth/drive.file`, klik **Authorize APIs**, pilih akun pemilik My Drive, dan setujui.
8. Klik **Exchange authorization code for tokens**. Simpan refresh token ke `.env` lokal. Jangan kirim token/secret ke chat atau commit ke git.

Tambahkan:

```dotenv
GOOGLE_DRIVE_CLIENT_ID=client_id_storage
GOOGLE_DRIVE_CLIENT_SECRET=client_secret_storage
GOOGLE_DRIVE_REFRESH_TOKEN=refresh_token_pemilik_storage
GOOGLE_DRIVE_FOLDER_ID=
```

`DATABASE_URL` dan `AUTH_SECRET` tetap diperlukan sebagaimana sebelumnya. Tidak perlu `GOOGLE_SERVICE_ACCOUNT_EMAIL` atau `GOOGLE_PRIVATE_KEY` untuk pilihan My Drive ini. Variabel storage tidak memakai prefix NEXT_PUBLIC.

Refresh token External/Testing untuk scope Drive biasanya kedaluwarsa setelah 7 hari. Untuk operasi berkelanjutan, selesaikan pengaturan publikasi/verification yang diminta Google; jangan menganggap token tidak pernah kedaluwarsa atau dicabut.

## Folder dan pemberian akses

Dengan scope `drive.file`, jangan sekadar membuat folder manual lalu menyalin ID: folder tersebut belum tentu diotorisasi untuk client ini. Gunakan helper agar folder dibuat oleh client storage yang sama:

```powershell
npx tsx scripts/setup-drive-storage.ts
```

Script ini membuat struktur berikut pada My Drive akun yang memberi refresh token:

```text
Asset Management Storage
└── Asset Photos
```

Script menampilkan URL folder serta `GOOGLE_DRIVE_FOLDER_ID=...`. Salin ID **Asset Photos** ke `.env`. ID juga terlihat pada URL `https://drive.google.com/drive/folders/ID_FOLDER`. Jalankan helper hanya sekali; jika `GOOGLE_DRIVE_FOLDER_ID` sudah terisi, script menolak membuat folder ganda. Jika setup terputus setelah folder induk dibuat, periksa folder induk dari URL yang tercetak sebelum mengulang.

Tidak perlu share ke service account: izin diberikan oleh akun storage melalui OAuth. Pertahankan **General access: Restricted** pada kedua folder dan jangan share ke pihak yang tidak berhak. Backend menolak upload jika folder mengizinkan `anyone`; backend tidak pernah memanggil API untuk membuat sharing publik. Kebijakan sharing folder di Drive tetap perlu dijaga administrator karena file mewarisi akses folder.

## Penyajian foto privat

Browser meminta `/api/assets/{assetId}/photos/{photoId}` dengan cookie aplikasi. Backend memverifikasi session, permission `assets.view`, relasi photo↔asset, dan asset belum soft-deleted; mengambil Drive ID dari DB, lalu men-stream media dari Drive menggunakan OAuth storage. Tidak ada redirect ke URL Drive atau pengiriman access token ke browser.

Respons: WebP, `Cache-Control: private, no-store`, `nosniff`, dan same-origin resource policy. Tanpa login: 401. Tanpa permission: 403. ID tidak cocok/tidak ada/asset dihapus: 404. Drive bermasalah: 502. Halaman QR publik tidak ditambahkan akses foto privat.

## Testing localhost

1. Untuk database lain, jalankan `npx prisma migrate deploy` dan `npx prisma generate`. Migrasi tambahan sudah diterapkan pada database lokal saat implementasi.
2. Isi credential storage, jalankan setup folder, isi ID, restart `npm run dev`.
3. Login dengan user berpermission `assets.manage`, buka Tambah Aset. Pilih gambar, lihat preview/nama, ganti/hapus sebelum simpan. Uji juga membuat asset tanpa foto.
4. Simpan foto besar dan periksa file Drive: WebP, maksimum sisi 1600px, nama asset+UUID; DB hanya berisi referensi/metadata. UI menampilkan loading saat submit.
5. Buka detail/edit: foto muncul. Ganti foto lalu simpan; foto baru tersimpan, foto lama dihapus. Hapus foto dan pastikan galeri lainnya tetap ada.
6. Coba file palsu dengan ekstensi JPG, GIF/SVG, file rusak, dan >10 MB. Semuanya harus ditolak tanpa referensi foto baru.
7. Matikan/ubah sementara credential storage: upload gagal dengan pesan jelas. Asset tanpa foto tetap dapat disimpan.
8. Uji URL foto tanpa cookie dan dengan role tanpa `assets.view`. Foto tidak boleh tampil. Soft delete asset: foto tetap di Drive, endpoint mengembalikan 404.
9. Jalankan worker retry setelah gangguan Drive pulih.

Pemeriksaan pengembang:

```powershell
npx tsx --test scripts/asset-photos.test.mjs
npm run typecheck
npx eslint --config eslint.asset-photos.config.mjs src/lib/asset-image.ts src/lib/google-drive.ts src/lib/asset-photo-storage.ts src/components/assets/asset-photo-field.tsx src/components/assets/asset-form-client.tsx src/components/assets/asset-photo-section.tsx "src/app/(dashboard)/dashboard/assets/*.ts" "src/app/(dashboard)/dashboard/assets/page.tsx" "src/app/api/assets/**/*.ts" scripts/cleanup-drive-photos.ts
npm run build
```

Tes otomatis memakai gambar sintetis, transaksi database lokal, serta mock Google; data tes dihapus setelah selesai. Upload Google sungguhan memerlukan credential milik administrator dan tidak dapat dibuktikan oleh mock.

Referensi resmi:
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/about-shareddrives
- https://developers.google.com/identity/protocols/oauth2
- https://sharp.pixelplumbing.com/api-resize/
- https://sharp.pixelplumbing.com/api-operation/
- https://sharp.pixelplumbing.com/api-output/
