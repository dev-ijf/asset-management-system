@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">{{ $asset->code }}</h1>
            <p class="text-muted mb-0">{{ $asset->name }}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
            @if($asset->qr_path)
                <a href="{{ asset('storage/'.$asset->qr_path) }}" class="btn btn-outline-primary" target="_blank">Download QR</a>
            @endif
            <a href="{{ route('assets.index') }}" class="btn btn-outline-secondary btn-wave">Kembali</a>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-xl-8">
            <div class="card custom-card">
                <div class="card-header">
                    <div class="card-title mb-0">Detail Aset</div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered text-nowrap mb-0">
                            <tbody>
                                <tr><th>Kode</th><td>{{ $asset->code }}</td></tr>
                                <tr><th>Nama</th><td>{{ $asset->name }}</td></tr>
                                <tr><th>Status</th><td>{{ $asset->status?->name ?: '-' }}</td></tr>
                                <tr><th>Kelas</th><td>{{ $asset->class?->name ?: '-' }}</td></tr>
                                <tr><th>Kategori</th><td>{{ $asset->category?->name ?: '-' }}</td></tr>
                                <tr><th>Lokasi</th><td>{{ $asset->location?->name ?: '-' }}</td></tr>
                                <tr><th>Departemen</th><td>{{ $asset->department?->name ?: '-' }}</td></tr>
                                <tr><th>Penanggung Jawab</th><td>{{ $asset->personInCharge?->name ?: '-' }}</td></tr>
                                <tr><th>Pengguna</th><td>{{ $asset->user?->name ?: '-' }}</td></tr>
                                <tr><th>Garansi</th><td>{{ $asset->warranty?->name ?: '-' }}</td></tr>
                                <tr><th>Akhir Garansi</th><td>{{ optional($asset->warranty_end)->format('d/m/Y') ?: '-' }}</td></tr>
                                <tr><th>Serial Number</th><td>{{ $asset->serial_number ?: '-' }}</td></tr>
                                <tr><th>Deskripsi</th><td>{{ $asset->description ?: '-' }}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-4">
            <div class="card custom-card h-100">
                <div class="card-header">
                    <div class="card-title mb-0">QR Aset</div>
                </div>
                <div class="card-body text-center">
                    @if($asset->qr_path)
                        <img src="{{ asset('storage/'.$asset->qr_path) }}" alt="QR {{ $asset->code }}" class="img-fluid mb-3">
                    @else
                        <p class="text-muted mb-3">QR belum tersedia.</p>
                    @endif
                    <p class="mb-0"><code>{{ route('assets.show', $asset) }}</code></p>
                </div>
            </div>
        </div>
    </div>
@endsection
