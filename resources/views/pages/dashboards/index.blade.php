
@extends('layouts.master')

@section('styles')



@endsection

@section('content')
	
<div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
    <div>
        <h1 class="page-title fw-medium fs-20 mb-0">Dashboard Aset</h1>
        <p class="text-muted mb-0">Ringkasan kesehatan aset, pergerakan, disposal, dan audit.</p>
    </div>
</div>

<div class="row g-3 mb-3">
    <div class="col-md-3">
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
            </div>
        </div>
    </div>
    <div class="col-md-3">
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
            </div>
        </div>
    </div>
    <div class="col-md-3">
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
            </div>
        </div>
    </div>
    <div class="col-md-3">
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
            </div>
        </div>
    </div>
</div>

<div class="row g-3">
    <div class="col-xl-6">
        <div class="card custom-card h-100">
            <div class="card-header">
                <div class="card-title mb-0">Distribusi Aset per Status</div>
            </div>
            <div class="card-body">
                <canvas id="chartStatus"></canvas>
            </div>
        </div>
    </div>
    <div class="col-xl-6">
        <div class="card custom-card h-100">
            <div class="card-header">
                <div class="card-title mb-0">Distribusi Aset per Lokasi</div>
            </div>
            <div class="card-body">
                <canvas id="chartLocation"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row g-3 mt-3">
    <div class="col-xl-6">
        <div class="card custom-card">
            <div class="card-header">
                <div class="card-title mb-0">Audit Terakhir</div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered text-nowrap align-middle mb-0">
                        <thead class="table-light">
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
            <div class="card-header">
                <div class="card-title mb-0">Disposal Terakhir</div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered text-nowrap align-middle mb-0">
                        <thead class="table-light">
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
                     
@endsection

@section('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const statusCtx = document.getElementById('chartStatus');
    const statusData = @json($byStatus);
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: statusData.map(i => i.label),
            datasets: [{
                data: statusData.map(i => i.value),
                backgroundColor: ['#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });

    const locCtx = document.getElementById('chartLocation');
    const locData = @json($byLocation);
    new Chart(locCtx, {
        type: 'bar',
        data: {
            labels: locData.map(i => i.label),
            datasets: [{
                label: 'Jumlah',
                data: locData.map(i => i.value),
                backgroundColor: '#22c55e'
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
</script>
@endsection
