@extends('layouts.master')

@section('content')
<div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
    <div>
        <h1 class="page-title fw-medium fs-20 mb-0">Laporan Penyusutan Aset</h1>
        <p class="text-muted mb-0">Nilai buku, residual value, dan metode depresiasi per aset.</p>
    </div>
    <div class="btn-list">
        <a href="{{ request()->fullUrlWithQuery(['export' => 'excel']) }}" class="btn btn-success btn-wave">Export Excel</a>
    </div>
</div>

<div class="card custom-card">
    <div class="card-header">
        <div class="card-title mb-0">Filter</div>
    </div>
    <div class="card-body">
        <form class="row g-2">
            <div class="col-md-3">
                <label class="form-label">Kelas</label>
                <select name="asset_class_id" class="form-select" onchange="this.form.submit()">
                    <option value="">Semua</option>
                    @foreach($classes as $c)
                        <option value="{{ $c->id }}" @selected(($filters['asset_class_id'] ?? '')==$c->id)>{{ $c->name }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Kategori</label>
                <select name="asset_category_id" class="form-select" onchange="this.form.submit()">
                    <option value="">Semua</option>
                    @foreach($categories as $c)
                        <option value="{{ $c->id }}" @selected(($filters['asset_category_id'] ?? '')==$c->id)>{{ $c->name }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Status</label>
                <select name="asset_status_id" class="form-select" onchange="this.form.submit()">
                    <option value="">Semua</option>
                    @foreach($statuses as $s)
                        <option value="{{ $s->id }}" @selected(($filters['asset_status_id'] ?? '')==$s->id)>{{ $s->name }}</option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-3 align-self-end">
                <a href="{{ route('reports.depreciations') }}" class="btn btn-link">Reset</a>
            </div>
        </form>
    </div>
</div>

<div class="card custom-card mt-3">
    <div class="card-header">
        <div class="card-title mb-0">Data Penyusutan</div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered align-middle text-nowrap">
                <thead class="table-light">
                    <tr>
                        <th>Kode</th>
                        <th>Nama</th>
                        <th>Kelas</th>
                        <th>Kategori</th>
                        <th>Status</th>
                        <th>Tgl Beli</th>
                        <th>Cost</th>
                        <th>Residual</th>
                        <th>Umur (bln)</th>
                        <th>Metode</th>
                        <th>Nilai Buku</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($items as $item)
                        <tr>
                            <td>{{ $item->code }}</td>
                            <td>{{ $item->name }}</td>
                            <td>{{ $item->class?->name ?: '-' }}</td>
                            <td>{{ $item->category?->name ?: '-' }}</td>
                            <td>{{ $item->status?->name ?: '-' }}</td>
                            <td>{{ optional($item->purchase_date)->format('d/m/Y') ?: '-' }}</td>
                            <td>{{ $item->cost ? number_format($item->cost,2,',','.') : '-' }}</td>
                            <td>{{ $item->residual_value ? number_format($item->residual_value,2,',','.') : '-' }}</td>
                            <td>{{ $item->useful_life_months ?? '-' }}</td>
                            <td class="text-uppercase">{{ $item->depreciation_method }}</td>
                            <td>{{ number_format($item->bookValue(),2,',','.') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="11" class="text-center text-muted">Belum ada data.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="mt-3">{{ $items->links() }}</div>
    </div>
</div>
@endsection
