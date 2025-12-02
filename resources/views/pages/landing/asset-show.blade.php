@extends('layouts.landing-master')

@section('content')
<section class="section" id="home">
    <div class="container">
        <div class="row g-4 align-items-center">
            <div class="col-lg-6">
                <div class="d-inline-flex align-items-center gap-2 text-default badge bg-white border fs-13 rounded-pill">
                    <span class="avatar avatar-xs avatar-rounded bg-warning"><i class="ri-qr-code-fill fs-14"></i></span>Asset Detail
                </div>
                <h1 class="fw-semibold mt-3 mb-2">{{ $asset->code }}</h1>
                <p class="fs-18 text-muted mb-3">{{ $asset->name }}</p>
                <div class="mb-3">
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered mb-0">
                            <tbody>
                                <tr><th>Status</th><td>{{ $asset->status?->name ?: '-' }}</td></tr>
                                <tr><th>Kategori</th><td>{{ $asset->category?->name ?: '-' }}</td></tr>
                                <tr><th>Lokasi</th><td>{{ $asset->location?->name ?: '-' }}</td></tr>
                                <tr><th>PIC</th><td>{{ $asset->personInCharge?->name ?: '-' }}</td></tr>
                                <tr><th>Pengguna</th><td>{{ $asset->user?->name ?: '-' }}</td></tr>
                                <tr><th>Garansi</th><td>{{ $asset->warranty?->name ?: '-' }}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                @auth
                    <div class="btn-list">
                        <a href="{{ route('assets.show', $asset) }}" class="btn btn-primary">Buka di Dashboard</a>
                        @can('movements.manage')
                            <a href="{{ route('assets.show', $asset) }}#movement" class="btn btn-outline-primary">Movement</a>
                        @endcan
                        @can('disposals.manage')
                            <a href="{{ route('assets.show', $asset) }}#disposal" class="btn btn-outline-danger">Disposal</a>
                        @endcan
                        @can('maintenance.manage')
                            <a href="{{ route('asset-maintenances.index') }}" class="btn btn-outline-success">Maintenance</a>
                        @endcan
                    </div>
                @else
                    <p class="text-muted">Untuk melakukan transaksi (movement/disposal/maintenance), silakan <a href="{{ route('login') }}">login</a>.</p>
                @endauth
            </div>
            <div class="col-lg-6">
                <div class="card custom-card">
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-md-6 text-center">
                                @if($asset->qr_path)
                                    <img src="{{ asset('storage/'.$asset->qr_path) }}" alt="QR {{ $asset->code }}" class="img-fluid mb-2" style="max-height:220px;">
                                    <p class="mb-0"><code>{{ route('assets.public.show', $asset) }}</code></p>
                                @else
                                    <p class="text-muted">QR belum tersedia.</p>
                                @endif
                            </div>
                            <div class="col-md-6">
                                <div class="row g-2">
                                    @forelse($asset->photos as $photo)
                                        <div class="col-6">
                                            <a href="{{ asset('storage/'.$photo->path) }}" target="_blank" class="d-block">
                                                <img src="{{ asset('storage/'.$photo->path) }}" class="img-fluid rounded" style="height:100px;object-fit:cover;" alt="foto aset">
                                            </a>
                                        </div>
                                    @empty
                                        <div class="col-12 text-muted small">Belum ada foto aset.</div>
                                    @endforelse
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
@endsection
