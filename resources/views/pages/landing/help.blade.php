@extends('layouts.landing-master')

@section('content')
<section class="section" id="help">
    <div class="container">
        <div class="heading-section">
            <div class="heading-subtitle">Help & FAQ</div>
            <div class="heading-title">Panduan singkat penggunaan sistem</div>
            <div class="heading-description">Cara cepat menjalankan modul utama.</div>
        </div>
        <div class="row g-3">
            <div class="col-lg-6">
                <div class="card custom-card">
                    <div class="card-body">
                        <h6 class="fw-semibold">Registrasi & QR</h6>
                        <p class="text-muted mb-2">Tambah aset dari dashboard, QR otomatis mengarah ke halaman publik untuk scan.</p>
                        <h6 class="fw-semibold">Movement/Disposal/Maintenance</h6>
                        <p class="text-muted mb-2">Gunakan tombol aksi di detail aset (login & izin diperlukan).</p>
                        <h6 class="fw-semibold">Audit</h6>
                        <p class="text-muted mb-0">Catat hasil audit matched/missing/damaged, lihat laporan di menu laporan audit.</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card custom-card">
                    <div class="card-body">
                        <h6 class="fw-semibold">FAQ Singkat</h6>
                        <ul class="list-unstyled mb-0 text-muted">
                            <li class="mb-2"><strong>Bagaimana mengganti batas upload?</strong> Ubah `asset.attachment_max_size_mb` di setting.</li>
                            <li class="mb-2"><strong>Bagaimana mengaktifkan QR?</strong> Pastikan `asset.qr_enabled` = true di setting.</li>
                            <li class="mb-2"><strong>Mode read-only?</strong> Set `maintenance.readonly_mode` = true agar semua write ditolak.</li>
                            <li><strong>Laporan?</strong> Menu Laporan menyediakan export Excel/PDF multi-sheet.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
@endsection
