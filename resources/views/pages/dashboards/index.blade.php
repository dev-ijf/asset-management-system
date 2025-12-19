
@extends('layouts.master')

@section('styles')



@endsection

@section('content')
	
<div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
    <div>
        <h1 class="page-title fw-medium fs-20 mb-0">Dashboard</h1>
        <p class="text-muted mb-0">Ringkasan operasional aset, risiko, workflow approval, dan tindakan yang perlu ditindaklanjuti.</p>
    </div>
    <div class="d-flex align-items-center gap-2 flex-wrap">
        @if(!empty($readonlyMode))
            <span class="badge bg-warning-transparent text-warning">
                <i class="ri-shield-flash-line me-1"></i>Mode Read-only Aktif
            </span>
        @endif
        <span class="badge bg-primary-transparent text-primary">
            <i class="ri-time-line me-1"></i>{{ now()->format('d/m/Y H:i') }}
        </span>
    </div>
</div>

@if(!empty($readonlyMode))
    <div class="alert alert-warning d-flex align-items-start gap-2" role="alert">
        <i class="ri-alert-line fs-18 mt-1"></i>
        <div>
            <div class="fw-semibold">Mode Read-only sedang aktif</div>
            <div class="text-muted">Semua aksi tulis (create/update/delete) dibatasi. Nonaktifkan melalui System Settings jika maintenance sudah selesai.</div>
        </div>
    </div>
@endif

<div class="row g-3 mb-3">
    <div class="col-md-4 col-xl-2">
        <div class="card custom-card">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted">Total Aset</p>
                        <h4 class="mb-0">{{ $totalAssets }}</h4>
                    </div>
                    <span class="avatar avatar-md bg-primary-transparent text-primary">
                        <i class="ri-archive-2-line fs-18"></i>
                    </span>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                    <span class="badge bg-light text-default">Arsip: {{ $archivedAssets ?? 0 }}</span>
                    <span class="badge bg-light text-default">Trash: {{ $softDeletedAssets ?? 0 }}</span>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4 col-xl-2">
        <div class="card custom-card">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted">Movement 30 hari</p>
                        <h4 class="mb-0">{{ $movementCount }}</h4>
                    </div>
                    <span class="avatar avatar-md bg-info-transparent text-info">
                        <i class="ri-route-line fs-18"></i>
                    </span>
                </div>
                <div class="fs-12 text-muted mt-2">Hanya yang berstatus approved.</div>
            </div>
        </div>
    </div>
    <div class="col-md-4 col-xl-2">
        <div class="card custom-card">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted">Disposal Aktif</p>
                        <h4 class="mb-0">{{ $disposalCount }}</h4>
                    </div>
                    <span class="avatar avatar-md bg-warning-transparent text-warning">
                        <i class="ri-delete-bin-6-line fs-18"></i>
                    </span>
                </div>
                <div class="fs-12 text-muted mt-2">Belum di-reverse.</div>
            </div>
        </div>
    </div>
    <div class="col-md-4 col-xl-2">
        <div class="card custom-card">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted">Audit Bermasalah</p>
                        <h4 class="mb-0">{{ $auditIssues }}</h4>
                    </div>
                    <span class="avatar avatar-md bg-danger-transparent text-danger">
                        <i class="ri-error-warning-line fs-18"></i>
                    </span>
                </div>
                <div class="fs-12 text-muted mt-2">Status missing/damaged.</div>
            </div>
        </div>
    </div>
    <div class="col-md-4 col-xl-2">
        <div class="card custom-card">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted">Warranty Akan Habis</p>
                        <h4 class="mb-0">{{ $warrantyExpiring ?? 0 }}</h4>
                    </div>
                    <span class="avatar avatar-md bg-success-transparent text-success">
                        <i class="ri-shield-check-line fs-18"></i>
                    </span>
                </div>
                <div class="fs-12 text-muted mt-2">Dalam window reminder setting.</div>
            </div>
        </div>
    </div>
    <div class="col-md-4 col-xl-2">
        <div class="card custom-card">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <p class="mb-1 text-muted">Approval Pending</p>
                        <h4 class="mb-0">{{ $pendingApprovalsCount ?? 0 }}</h4>
                    </div>
                    <span class="avatar avatar-md bg-secondary-transparent text-secondary">
                        <i class="ri-shield-user-line fs-18"></i>
                    </span>
                </div>
                <div class="fs-12 text-muted mt-2">Movement/Disposal/Maintenance.</div>
            </div>
        </div>
    </div>
</div>

<div class="row g-3">
    <div class="col-xl-8">
        <div class="card custom-card h-100">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="card-title mb-0">Tren Aktivitas (14 Hari)</div>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge bg-info-transparent text-info">Movement</span>
                    <span class="badge bg-warning-transparent text-warning">Disposal</span>
                    <span class="badge bg-danger-transparent text-danger">Audit Issues</span>
                </div>
            </div>
            <div class="card-body">
                <canvas id="chartTrend" height="110"></canvas>
            </div>
        </div>
    </div>
    <div class="col-xl-4">
        <div class="card custom-card h-100">
            <div class="card-header">
                <div class="card-title mb-0">Tindak Lanjut Cepat</div>
            </div>
            <div class="card-body">
                <div class="d-flex flex-column gap-3">
                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <div>
                            <div class="fw-semibold">Maintenance Terbuka</div>
                            <div class="text-muted fs-12">Planned / in progress yang masih berjalan.</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-semibold">{{ $maintenanceOpen ?? 0 }}</div>
                            @can('maintenance.manage')
                                <a class="fs-12" href="{{ route('asset-maintenances.index') }}">Lihat</a>
                            @endcan
                        </div>
                    </div>
                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <div>
                            <div class="fw-semibold">Consumable Low Stock</div>
                            <div class="text-muted fs-12">Stok ≤ threshold setting.</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-semibold">{{ $lowStockConsumables ?? 0 }}</div>
                            @canany(['assets.view','assets.manage'])
                                <a class="fs-12" href="{{ route('assets.index', ['type' => 'consumable']) }}">Filter</a>
                            @endcanany
                        </div>
                    </div>
                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <div>
                            <div class="fw-semibold">Warranty Akan Habis</div>
                            <div class="text-muted fs-12">Perlu reminder/penjadwalan.</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-semibold">{{ $warrantyExpiring ?? 0 }}</div>
                            @canany(['assets.view','assets.manage'])
                                <a class="fs-12" href="{{ route('assets.index', ['warranty' => 'expiring']) }}">Filter</a>
                            @endcanany
                        </div>
                    </div>
                    @can('approvals.manage')
                        <div class="d-flex align-items-start justify-content-between gap-3">
                            <div>
                                <div class="fw-semibold">Approval Pending</div>
                                <div class="text-muted fs-12">Perlu keputusan approve/reject.</div>
                            </div>
                            <div class="text-end">
                                <div class="fw-semibold">{{ $pendingApprovalsCount ?? 0 }}</div>
                                <a class="fs-12" href="{{ route('approvals.index') }}">Buka</a>
                            </div>
                        </div>
                    @endcan
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-3 mt-0">
    <div class="col-xl-4 col-md-6">
        <div class="card custom-card h-100">
            <div class="card-header">
                <div class="card-title mb-0">Distribusi Aset per Status</div>
            </div>
            <div class="card-body">
                <canvas id="chartStatus" height="110"></canvas>
            </div>
        </div>
    </div>
    <div class="col-xl-4 col-md-6">
        <div class="card custom-card h-100">
            <div class="card-header">
                <div class="card-title mb-0">Top Lokasi (10)</div>
            </div>
            <div class="card-body">
                <canvas id="chartLocation" height="110"></canvas>
            </div>
        </div>
    </div>
    <div class="col-xl-4 col-md-12">
        <div class="card custom-card h-100">
            <div class="card-header">
                <div class="card-title mb-0">Top Kategori (10)</div>
            </div>
            <div class="card-body">
                <canvas id="chartCategory" height="110"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row g-3 mt-3">
    <div class="col-xl-6">
        <div class="card custom-card">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="card-title mb-0">Audit Terakhir</div>
                @can('audits.manage')
                    <a href="{{ route('asset-audits.index') }}" class="btn btn-sm btn-light">Lihat Semua</a>
                @endcan
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table text-nowrap align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Aset</th>
                                <th>Status</th>
                                <th>Waktu</th>
                                <th>Catatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($recentAudits as $audit)
                                <tr>
                                    <td>{{ $audit->asset?->code }} - {{ $audit->asset?->name }}</td>
                                    <td><span class="badge bg-info-transparent text-info">{{ ucfirst($audit->status) }}</span></td>
                                    <td>{{ optional($audit->audited_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                    <td>{{ $audit->notes ?: '-' }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="text-center text-muted">Belum ada data audit.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-6">
        <div class="card custom-card">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="card-title mb-0">Disposal Terakhir</div>
                @can('disposals.manage')
                    <a href="{{ route('asset-disposals.index') }}" class="btn btn-sm btn-light">Lihat Semua</a>
                @endcan
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table text-nowrap align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Aset</th>
                                <th>Alasan</th>
                                <th>Waktu</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($recentDisposals as $disposal)
                                <tr>
                                    <td>{{ $disposal->asset?->code }} - {{ $disposal->asset?->name }}</td>
                                    <td>{{ $disposal->reason ?: '-' }}</td>
                                    <td>{{ optional($disposal->disposed_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                    <td>
                                        @if($disposal->reversed_at)
                                            <span class="badge bg-success-transparent text-success">Reversed</span>
                                        @else
                                            <span class="badge bg-warning-transparent text-warning">Active</span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="text-center text-muted">Belum ada data disposal.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-3 mt-3">
    <div class="col-xl-7">
        <div class="card custom-card">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="card-title mb-0">Movement Terakhir</div>
                @can('movements.manage')
                    <a href="{{ route('asset-movements.index') }}" class="btn btn-sm btn-light">Lihat Semua</a>
                @endcan
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table text-nowrap align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Aset</th>
                                <th>Dari</th>
                                <th>Ke</th>
                                <th>Status</th>
                                <th>Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($recentMovements as $mv)
                                <tr>
                                    <td>{{ $mv->asset?->code }} - {{ $mv->asset?->name }}</td>
                                    <td class="text-muted">
                                        {{ $mv->fromLocation?->name ?: '-' }} / {{ $mv->fromDepartment?->name ?: '-' }}
                                    </td>
                                    <td class="text-muted">
                                        {{ $mv->toLocation?->name ?: '-' }} / {{ $mv->toDepartment?->name ?: '-' }}
                                    </td>
                                    <td>
                                        @php($st = $mv->status ?: 'approved')
                                        @if($st === 'approved')
                                            <span class="badge bg-success-transparent text-success">Approved</span>
                                        @elseif($st === 'pending')
                                            <span class="badge bg-warning-transparent text-warning">Pending</span>
                                        @else
                                            <span class="badge bg-danger-transparent text-danger">{{ ucfirst($st) }}</span>
                                        @endif
                                    </td>
                                    <td>{{ optional($mv->performed_at)->format('d/m/Y H:i') ?: optional($mv->created_at)->format('d/m/Y H:i') }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="5" class="text-center text-muted">Belum ada data movement.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-5">
        <div class="card custom-card">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="card-title mb-0">Approval Pending (Terbaru)</div>
                @can('approvals.manage')
                    <a href="{{ route('approvals.index') }}" class="btn btn-sm btn-light">Kelola</a>
                @endcan
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table text-nowrap align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Requester</th>
                                <th>Dibuat</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($pendingApprovals as $appr)
                                <tr>
                                    <td><span class="badge bg-secondary-transparent text-secondary">{{ strtoupper($appr->type) }}</span></td>
                                    <td>{{ $appr->requester?->name ?: '-' }}</td>
                                    <td>{{ optional($appr->created_at)->format('d/m/Y H:i') }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="3" class="text-center text-muted">Tidak ada approval pending.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
                @if(!empty($maintenanceDueSoon) && $maintenanceDueSoon->count())
                    <div class="mt-4">
                        <div class="fw-semibold mb-2">Maintenance Due (7 Hari)</div>
                        <ul class="list-unstyled mb-0">
                            @foreach($maintenanceDueSoon as $m)
                                <li class="d-flex align-items-start justify-content-between gap-2 py-1">
                                    <div class="text-truncate">
                                        <div class="fw-medium text-truncate">{{ $m->asset?->code }} - {{ $m->asset?->name }}</div>
                                        <div class="text-muted fs-12 text-truncate">{{ $m->description }}</div>
                                    </div>
                                    <div class="text-muted fs-12 text-nowrap">{{ optional($m->performed_at)->format('d/m/Y') }}</div>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
                     
@endsection

@section('scripts')
<script src="{{ asset('build/assets/libs/chart.js/chart.umd.js') }}"></script>
<script>
    const trendLabels = @json($trendLabels ?? []);
    const movementTrend = @json($movementTrend ?? []);
    const disposalTrend = @json($disposalTrend ?? []);
    const auditIssueTrend = @json($auditIssueTrend ?? []);

    const trendCtx = document.getElementById('chartTrend');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [
                    { label: 'Movement', data: movementTrend, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.15)', tension: 0.35, fill: true },
                    { label: 'Disposal', data: disposalTrend, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', tension: 0.35, fill: true },
                    { label: 'Audit Issues', data: auditIssueTrend, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', tension: 0.35, fill: true },
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    const statusCtx = document.getElementById('chartStatus');
    const statusData = @json($byStatus ?? []);
    if (statusCtx) {
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusData.map(i => i.label),
                datasets: [{
                    data: statusData.map(i => i.value),
                    backgroundColor: ['#0ea5e9','#22c55e','#f59e0b','#ef4444','#a78bfa','#94a3b8','#14b8a6','#f97316']
                }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    }

    const locCtx = document.getElementById('chartLocation');
    const locData = @json($byLocation ?? []);
    if (locCtx) {
        new Chart(locCtx, {
            type: 'bar',
            data: {
                labels: locData.map(i => i.label),
                datasets: [{
                    label: 'Jumlah Aset',
                    data: locData.map(i => i.value),
                    backgroundColor: '#22c55e'
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    const catCtx = document.getElementById('chartCategory');
    const catData = @json($byCategory ?? []);
    if (catCtx) {
        new Chart(catCtx, {
            type: 'bar',
            data: {
                labels: catData.map(i => i.label),
                datasets: [{
                    label: 'Jumlah Aset',
                    data: catData.map(i => i.value),
                    backgroundColor: '#a78bfa'
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }
</script>
@endsection
