@extends('reports.layout', ['title' => 'Laporan Audit', 'subtitle' => 'Filter per tanggal, status, lokasi'])

@section('filters')
    @include('reports.partials.audit_filters', ['filters' => $filters, 'assets' => $assets, 'locations' => $locations])
@endsection

@section('report-table')
    <div class="table-responsive">
        <table class="table table-bordered text-nowrap align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Waktu</th><th>Aset</th><th>Status</th><th>Lokasi</th><th>Catatan</th>
                </tr>
            </thead>
            <tbody>
                @forelse($items as $item)
                    <tr>
                        <td>{{ optional($item->audited_at)->format('d/m/Y H:i') ?: '-' }}</td>
                        <td>{{ $item->asset?->code }} - {{ $item->asset?->name }}</td>
                        <td>{{ ucfirst($item->status) }}</td>
                        <td>{{ $item->location?->name }}</td>
                        <td>{{ $item->notes ?: '-' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="text-center text-muted">Data tidak ditemukan.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-3">
        {{ $items->links() }}
    </div>
@endsection
