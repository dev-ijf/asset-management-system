@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Audit Aset</h1>
            <p class="text-muted mb-0">Pantau kesesuaian fisik vs data sistem.</p>
        </div>
    </div>
    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Audit</div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered text-nowrap align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Waktu</th>
                            <th>Aset</th>
                            <th>Status</th>
                            <th>Lokasi</th>
                            <th>Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($items as $item)
                            <tr>
                                <td>{{ optional($item->audited_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                <td>{{ $item->asset?->code }} - {{ $item->asset?->name }}</td>
                                <td><span class="badge bg-info-transparent text-info">{{ ucfirst($item->status) }}</span></td>
                                <td>{{ $item->location?->name ?: '-' }}</td>
                                <td>{{ $item->notes ?: '-' }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="text-center text-muted">Belum ada audit.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $items->links() }}
        </div>
    </div>
@endsection
