@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Perawatan Aset</h1>
            <p class="text-muted mb-0">Catat dan pantau riwayat perawatan/maintenance aset.</p>
        </div>
        <button class="btn btn-primary btn-wave" data-bs-toggle="modal" data-bs-target="#maintenanceCreateModal">
            <i class="ri-add-line me-1"></i>Tambah
        </button>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Data Perawatan</div>
        </div>
        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success alert-dismissible" role="alert">
                    {{ session('success') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
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

            <div class="table-responsive">
                <table class="table table-bordered text-nowrap align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Aset</th>
                            <th>Tanggal</th>
                            <th>Deskripsi</th>
                            <th>Vendor</th>
                            <th>Biaya</th>
                            <th>Status</th>
                            <th>Catatan</th>
                            <th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($maintenances as $item)
                            <tr>
                                <td>{{ $item->asset?->code }} - {{ $item->asset?->name }}</td>
                                <td>{{ optional($item->performed_at)->format('d/m/Y') ?: '-' }}</td>
                                <td>{{ $item->description }}</td>
                                <td>{{ $item->vendor ?: '-' }}</td>
                                <td>{{ $item->cost ? number_format($item->cost, 2, ',', '.') : '-' }}</td>
                                <td><span class="badge bg-info-transparent text-info">{{ $item->status }}</span></td>
                                <td>{{ $item->notes ?: '-' }}</td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#maintenanceEditModal"
                                        data-id="{{ $item->id }}"
                                        data-asset_id="{{ $item->asset_id }}"
                                        data-performed_at="{{ optional($item->performed_at)?->format('Y-m-d') }}"
                                        data-description="{{ $item->description }}"
                                        data-vendor="{{ $item->vendor }}"
                                        data-cost="{{ $item->cost }}"
                                        data-status="{{ $item->status }}"
                                        data-notes="{{ $item->notes }}">
                                        Edit
                                    </button>
                                    <form action="{{ route('asset-maintenances.destroy', $item) }}" method="POST" class="d-inline" onsubmit="return confirm('Hapus data perawatan ini?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="8" class="text-center text-muted">Belum ada data perawatan.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-3">{{ $maintenances->links() }}</div>
        </div>
    </div>

    {{-- Modal create --}}
    <div class="modal fade" id="maintenanceCreateModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Tambah Perawatan</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('asset-maintenances.store') }}" method="POST">
                    @csrf
                    @include('assets.partials.maintenance_form')
                </form>
            </div>
        </div>
    </div>

    {{-- Modal edit --}}
    <div class="modal fade" id="maintenanceEditModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Perawatan</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="maintenanceEditForm" method="POST">
                    @csrf
                    @method('PUT')
                    @include('assets.partials.maintenance_form')
                </form>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
<script>
    const maintEditModal = document.getElementById('maintenanceEditModal');
    if (maintEditModal) {
        maintEditModal.addEventListener('show.bs.modal', function (event) {
            const btn = event.relatedTarget;
            const form = document.getElementById('maintenanceEditForm');
            form.action = "{{ url('asset-maintenances') }}/" + btn.getAttribute('data-id');
            form.querySelector('[name="asset_id"]').value = btn.getAttribute('data-asset_id');
            form.querySelector('[name="performed_at"]').value = btn.getAttribute('data-performed_at') || '';
            form.querySelector('[name="description"]').value = btn.getAttribute('data-description') || '';
            form.querySelector('[name="vendor"]').value = btn.getAttribute('data-vendor') || '';
            form.querySelector('[name="cost"]').value = btn.getAttribute('data-cost') || '';
            form.querySelector('[name="status"]').value = btn.getAttribute('data-status') || 'completed';
            form.querySelector('[name="notes"]').value = btn.getAttribute('data-notes') || '';
        });
    }
</script>
@endsection
