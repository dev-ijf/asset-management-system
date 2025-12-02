@extends('layouts.landing-master')

@section('content')
<section class="section" id="changelog">
    <div class="container">
        <div class="heading-section">
            <div class="heading-subtitle">Changelog</div>
            <div class="heading-title">Ringkasan perubahan</div>
        </div>
        <div class="card custom-card">
            <div class="card-body">
                <ul class="mb-0">
                    <li class="mb-2">QR publik untuk setiap aset, galeri foto, dan aksi transaksi di dashboard.</li>
                    <li class="mb-2">Fitur movement, disposal, reverse, maintenance, audit, serta laporan Excel/PDF multi-sheet.</li>
                    <li class="mb-2">RBAC lengkap (super-admin, asset-manager, auditor, maintenance, viewer).</li>
                    <li class="mb-2">Setting sistem: prefix kode aset, batas upload, audit log toggle, read-only mode.</li>
                    <li>Landing diperbarui dengan CTA login/dashboard dan halaman bantuan.</li>
                </ul>
            </div>
        </div>
    </div>
</section>
@endsection
