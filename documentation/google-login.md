# Sign in with Google

## Arsitektur

Login aktif menggunakan Next.js 15 App Router (bukan autentikasi Laravel yang masih ada di repository), Server Action, bcrypt, Prisma dan PostgreSQL. User tersimpan di `users`. Session aplikasi adalah cookie HttpOnly `ams_session`, SameSite=Lax, Secure pada production, dengan tanda tangan HMAC dan masa berlaku 8 jam. `getCurrentUser()` memuat role dan permission dari database pada kedua metode login.

Google memakai authorization-code flow di backend dan library `jose` untuk memverifikasi ID token dengan public keys Google. Validasi mencakup signature RS256, issuer, audience, expiry, nonce dan verified email; state dan PKCE melindungi alur redirect. Cookie flow HttpOnly berlaku 10 menit dan dibersihkan pada callback. Token Google tidak disimpan, user tidak dibuat otomatis, dan nama/role/password user yang sudah ada tidak diubah. Email terverifikasi dicocokkan dengan email lowercase di database seperti login password yang ada.

Endpoint mulai: `/api/auth/google`. Callback: `/api/auth/google/callback`. Setelah berhasil, callback menggunakan `createSession()` yang sama dan mengarahkan ke `/dashboard`. Tidak ada migrasi database yang diperlukan.

## Konfigurasi localhost

Tambahkan ke `.env` (jangan gunakan prefix NEXT_PUBLIC):

```dotenv
GOOGLE_CLIENT_ID=isi_client_id_dari_google
GOOGLE_CLIENT_SECRET=isi_client_secret_dari_google
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

`DATABASE_URL` dan `AUTH_SECRET` yang sudah digunakan aplikasi harus tetap terisi. Jangan commit `.env`.

1. Buat/pilih project di Google Cloud Console, buka Google Auth Platform.
2. Isi Branding/consent screen dan Audience sesuai organisasi. Jika External masih Testing, tambahkan akun uji ke Test users.
3. Buat OAuth Client dengan application type **Web application**.
4. Authorized JavaScript origins: `http://localhost:3000`. Implementasi ini memakai redirect server sehingga tidak membutuhkan SDK JavaScript; origin ini adalah origin aplikasi jika kolom tersebut diisi.
5. Authorized redirect URIs: **`http://localhost:3000/api/auth/google/callback`**. Harus sama persis dengan `.env`; tanpa slash tambahan.
6. Salin Client ID dan Client Secret ke `.env`, lalu restart `npm run dev`.

Untuk deployment, gunakan origin HTTPS aplikasi sebenarnya dan path callback yang sama. Jangan mencampur `localhost` dengan `127.0.0.1` saat menguji karena cookie terikat host.

Referensi: https://developers.google.com/identity/openid-connect/openid-connect

## Pengujian manual

1. Buka `http://localhost:3000/login`. Login email/password harus tetap berhasil; logout sebelum setiap pengujian Google.
2. Pastikan administrator sudah membuat user dengan email Google yang akan dipakai dan menetapkan role/permission di aplikasi.
3. Klik **Sign in with Google**, pilih email terdaftar, lalu pastikan masuk dashboard dengan akses sesuai role database (uji juga role viewer).
4. Logout, pilih akun Google yang tidak ada di tabel users. Harus kembali ke login dengan pesan "Akun Google ini belum terdaftar pada sistem. Silakan hubungi administrator." Tidak boleh ada user baru atau session baru.
5. Batalkan persetujuan Google. Harus kembali dengan pesan pembatalan.
6. Buka callback langsung/tanpa state yang benar. Harus ditolak. Ulangi dengan flow kedaluwarsa (>10 menit).
7. Jika credential belum diisi, tombol tetap tampil dan membawa pengguna ke pesan konfigurasi; login password tetap tersedia.

Google interaktif memerlukan credential asli dan akun uji, sehingga tes lokal otomatis tidak menggantikan langkah tersebut.

## Pemeriksaan otomatis

```powershell
node --experimental-strip-types --test scripts/google-oauth.test.mjs
npx eslint --config eslint.google.config.mjs src/lib/google-oauth.ts src/app/api/auth/google/route.ts src/app/api/auth/google/callback/route.ts src/app/login/page.tsx src/app/login/login-form.tsx
npm run typecheck
npm run build
```

ESLint dikonfigurasi khusus file fitur ini karena repository sebelumnya tidak mempunyai konfigurasi ESLint. Tes memeriksa state/expiry/PKCE, signature token, issuer/audience/expiry/nonce, email terverifikasi, dan pencocokan user terdaftar.

Catatan kondisi sebelumnya: checkbox **Ingat saya** disabled dan **Lupa password?** hanya teks pada halaman Next.js. Fitur Google tidak mengubah keduanya atau menambahkan implementasi reset password. Kolom 2FA ada di model, tetapi login password Next.js yang ada belum menjalankan challenge 2FA.
