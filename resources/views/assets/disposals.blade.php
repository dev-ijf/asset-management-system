@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Disposal Aset</h1>
            <p class="text-muted mb-0">Riwayat disposal dan reverse aset.</p>
        </div>
    </div>
    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Disposal</div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered text-nowrap align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Waktu</th>
                            <th>Aset</th>
                            <th>Alasan</th>
                            <th>Catatan</th>
                            <th>Status Reverse</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($items as $item)
                            <tr>
                                <td>{{ optional($item->disposed_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                <td>{{ $item->asset?->code }} - {{ $item->asset?->name }}</td>
                                <td>{{ $item->reason ?: '-' }}</td>
                                <td>{{ $item->notes ?: '-' }}</td>
                                <td>
                                    @if($item->reversed_at)
                                        <span class="badge bg-success-transparent text-success">Reversed ({{ $item->reversed_at->format('d/m/Y H:i') }})</span>
                                    @else
                                        <span class="badge bg-warning-transparent text-warning">Active</span>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="text-center text-muted">Belum ada disposal.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $items->links() }}
        </div>
    </div>
@endsection
