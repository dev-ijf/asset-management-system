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
            <form class="row g-2 mb-3" method="GET">
                <div class="col-md-3">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-select" onchange="this.form.submit()">
                        <option value="">Semua</option>
                        <option value="pending" @selected(($status ?? '')==='pending')>Pending</option>
                        <option value="approved" @selected(($status ?? '')==='approved')>Approved</option>
                        <option value="rejected" @selected(($status ?? '')==='rejected')>Rejected</option>
                    </select>
                </div>
                <div class="col-md-3 align-self-end">
                    <button class="btn btn-outline-secondary">Filter</button>
                    <a href="{{ route('asset-disposals.index') }}" class="btn btn-link">Reset</a>
                </div>
            </form>
            <div class="table-responsive">
                <table class="table table-bordered text-nowrap align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Waktu</th>
                            <th>Aset</th>
                            <th>Alasan</th>
                            <th>Status</th>
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
                                <td><span class="badge bg-info-transparent text-info text-uppercase">{{ $item->status }}</span></td>
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
                                <td colspan="6" class="text-center text-muted">Belum ada disposal.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $items->links() }}
        </div>
    </div>
@endsection
