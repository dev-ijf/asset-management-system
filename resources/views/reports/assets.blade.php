@php
    $filtersView = view('reports.partials.asset_filters', compact('filters','statuses','classes','categories','locations','departments','users','pics','warranties'));
@endphp

@extends('reports.layout', ['title' => 'Laporan Aset', 'subtitle' => 'Filter by status, lokasi, PIC, pengguna, garansi', 'filtersView' => $filtersView])

@section('content')
    @parent
    <div class="table-responsive">
        <table class="table table-bordered text-nowrap align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Kode</th><th>Nama</th><th>Status</th><th>Kategori</th><th>Lokasi</th><th>Dept</th><th>User</th><th>PIC</th><th>Garansi</th><th>Dibuat</th>
                </tr>
            </thead>
            <tbody>
                @forelse($assets as $asset)
                    <tr>
                        <td>{{ $asset->code }}</td>
                        <td>{{ $asset->name }}</td>
                        <td>{{ $asset->status?->name }}</td>
                        <td>{{ $asset->category?->name }}</td>
                        <td>{{ $asset->location?->name }}</td>
                        <td>{{ $asset->department?->name }}</td>
                        <td>{{ $asset->user?->name }}</td>
                        <td>{{ $asset->personInCharge?->name }}</td>
                        <td>{{ $asset->warranty?->name }}</td>
                        <td>{{ optional($asset->created_at)->format('d/m/Y') }}</td>
                    </tr>
                @empty
                    <tr><td colspan="10" class="text-center text-muted">Data tidak ditemukan.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-3">
        {{ $assets->links() }}
    </div>
@endsection
