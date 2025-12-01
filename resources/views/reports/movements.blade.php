@php
    $filtersView = view('reports.partials.movement_filters', compact('filters','assets','locations','departments','users'));
@endphp

@extends('reports.layout', ['title' => 'Laporan Movement', 'subtitle' => 'Filter per tanggal, lokasi, dept, user', 'filtersView' => $filtersView])

@section('content')
    @parent
    <div class="table-responsive">
        <table class="table table-bordered text-nowrap align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Waktu</th><th>Aset</th><th>Dari</th><th>Ke</th><th>Catatan</th>
                </tr>
            </thead>
            <tbody>
                @forelse($items as $item)
                    <tr>
                        <td>{{ optional($item->performed_at)->format('d/m/Y H:i') ?: '-' }}</td>
                        <td>{{ $item->asset?->code }} - {{ $item->asset?->name }}</td>
                        <td>{{ $item->fromLocation?->name ?: '-' }} / {{ $item->fromDepartment?->name ?: '-' }} / {{ $item->fromUser?->name ?: '-' }}</td>
                        <td>{{ $item->toLocation?->name ?: '-' }} / {{ $item->toDepartment?->name ?: '-' }} / {{ $item->toUser?->name ?: '-' }}</td>
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
