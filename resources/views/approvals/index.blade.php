@extends('layouts.master')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3 page-header-breadcrumb flex-wrap gap-2">
    <div>
        <h1 class="page-title fw-medium fs-20 mb-0">Approval Pending</h1>
        <p class="text-muted mb-0">Daftar movement, disposal, dan maintenance yang menunggu persetujuan.</p>
    </div>
</div>

@if(session('success'))
    <div class="alert alert-success">{{ session('success') }}</div>
@endif
@if($errors->any())
    <div class="alert alert-danger">
        <ul class="mb-0">
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<div class="card custom-card">
    <div class="card-header">
        <div class="card-title mb-0">Menunggu Approval</div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table text-nowrap align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Type</th>
                        <th>Asset</th>
                        <th>Diminta Oleh</th>
                        <th>Catatan</th>
                        <th>Waktu</th>
                        <th class="text-center" style="width: 180px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($pending as $approval)
                        @php
                            $approvable = $approval->approvable;
                            $asset = method_exists($approvable, 'asset') ? $approvable->asset : null;
                        @endphp
                        <tr>
                            <td><span class="badge bg-primary-transparent text-primary text-uppercase">{{ $approval->type }}</span></td>
                            <td>
                                @if($asset)
                                    <div class="fw-semibold">{{ $asset->code }}</div>
                                    <div class="text-muted small">{{ $asset->name }}</div>
                                @else
                                    <span class="text-muted">-</span>
                                @endif
                            </td>
                            <td>{{ optional($approval->requester)->name ?? 'Tidak diketahui' }}</td>
                            <td class="small text-muted">{{ Str::limit($approvable->notes ?? $approvable->description ?? '-', 60) }}</td>
                            <td>{{ $approval->created_at?->format('d/m/Y H:i') }}</td>
                            <td class="text-center">
                                <div class="btn-group" role="group">
                                    <form action="{{ route('approvals.approve', $approval) }}" method="POST" class="d-inline">
                                        @csrf
                                        <button class="btn btn-sm btn-success btn-wave" onclick="return confirm('Setujui permintaan ini?')">Approve</button>
                                    </form>
                                    <form action="{{ route('approvals.reject', $approval) }}" method="POST" class="d-inline ms-1">
                                        @csrf
                                        <button class="btn btn-sm btn-danger btn-wave" onclick="return confirm('Tolak permintaan ini?')">Reject</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center text-muted">Tidak ada approval pending.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            {{ $pending->links() }}
        </div>
    </div>
</div>
@endsection
