@extends('layouts.landing-master')

@section('content')
<section class="section" id="home">
    <div class="container">
        <div class="row g-4 align-items-start">
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
                        @php $firstPhoto = $asset->photos->first(); @endphp
                        <div class="mb-3 text-center">
                            <img id="main-asset-photo" src="{{ $firstPhoto ? asset('storage/'.$firstPhoto->path) : asset('landing-asset-hero.jpg') }}" alt="foto aset" class="img-fluid rounded" style="height:320px;object-fit:cover;">
                        </div>
                        <div class="d-flex gap-2 flex-wrap justify-content-center">
                            @forelse($asset->photos as $photo)
                                <button class="thumb-btn border-0 p-0 bg-transparent" data-src="{{ asset('storage/'.$photo->path) }}">
                                    <img src="{{ asset('storage/'.$photo->path) }}" class="img-thumbnail {{ $loop->first ? 'border border-2 border-primary' : '' }}" style="width:90px;height:90px;object-fit:cover;" alt="foto aset">
                                </button>
                            @empty
                                <span class="text-muted small">Belum ada foto aset.</span>
                            @endforelse
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

@section('scripts')
<script>
    document.querySelectorAll('.thumb-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const main = document.getElementById('main-asset-photo');
            main.src = this.dataset.src;
            document.querySelectorAll('.thumb-btn img').forEach(img => img.classList.remove('border-primary','border','border-2'));
            this.querySelector('img').classList.add('border','border-2','border-primary');
        });
    });
</script>
@endsection
@endsection
