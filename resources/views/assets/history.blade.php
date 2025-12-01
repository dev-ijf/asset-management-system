@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Riwayat Aset {{ $asset->code }}</h1>
            <p class="text-muted mb-0">{{ $asset->name }}</p>
        </div>
        <a href="{{ route('assets.index') }}" class="btn btn-outline-secondary btn-wave">Kembali</a>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Riwayat Perubahan</div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered align-middle text-nowrap">
                    <thead class="table-light">
                        <tr>
                            <th>Waktu</th>
                            <th>Aksi</th>
                            <th>Deskripsi</th>
                            <th>Payload</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($asset->histories()->latest()->get() as $history)
                            <tr>
                                <td>{{ $history->created_at->format('d/m/Y H:i') }}</td>
                                <td>{{ $history->action }}</td>
                                <td>{{ $history->description }}</td>
                                <td><pre class="mb-0 small">{{ json_encode($history->payload, JSON_PRETTY_PRINT) }}</pre></td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="text-center text-muted">Belum ada riwayat.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
