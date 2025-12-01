@extends('reports.layout', ['title' => 'Laporan Disposal', 'subtitle' => 'Filter per tanggal, status reverse'])

@section('filters')
    @include('reports.partials.disposal_filters', ['filters' => $filters, 'assets' => $assets])
@endsection

@section('report-table')
    <div class="table-responsive">
        <table class="table table-bordered text-nowrap align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Waktu</th><th>Aset</th><th>Alasan</th><th>Catatan</th><th>Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($items as $item)
                    <tr>
                        <td>{{ optional($item->disposed_at)->format('d/m/Y H:i') ?: '-' }}</td>
                        <td>{{ $item->asset?->code }} - {{ $item->asset?->name }}</td>
                        <td>{{ $item->reason ?: '-' }}</td>
                        <td>{{ $item->notes ?: '-' }}</td>
                        <td>{{ $item->reversed_at ? 'Reversed' : 'Active' }}</td>
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
