@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Vendor & Kontrak</h1>
            <p class="text-muted mb-0">Kelola vendor, kontrak, dan SLA untuk integrasi aset.</p>
        </div>
        <button class="btn btn-primary btn-wave" data-bs-toggle="modal" data-bs-target="#createVendorModal">
            <i class="ri-add-line me-1"></i>Tambah
        </button>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Data Vendor / Kontrak</div>
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
                <table class="table table-bordered align-middle text-nowrap mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Vendor</th>
                            <th>Kontrak #</th>
                            <th>Periode</th>
                            <th>SLA (Resp/Res)</th>
                            <th>Catatan</th>
                            <th class="text-center" style="width: 10%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($contracts as $item)
                            <tr>
                                <td>{{ $item->vendor_name }}</td>
                                <td>{{ $item->contract_number ?: '-' }}</td>
                                <td>
                                    {{ optional($item->start_date)->format('d/m/Y') ?: '-' }} -
                                    {{ optional($item->end_date)->format('d/m/Y') ?: '-' }}
                                </td>
                                <td>{{ $item->sla_response_hours ?? '-' }}h / {{ $item->sla_resolution_hours ?? '-' }}h</td>
                                <td>{{ $item->notes ?: '-' }}</td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#editVendorModal"
                                        data-id="{{ $item->id }}"
                                        data-vendor_name="{{ $item->vendor_name }}"
                                        data-contract_number="{{ $item->contract_number }}"
                                        data-start_date="{{ optional($item->start_date)?->format('Y-m-d') }}"
                                        data-end_date="{{ optional($item->end_date)?->format('Y-m-d') }}"
                                        data-sla_response_hours="{{ $item->sla_response_hours }}"
                                        data-sla_resolution_hours="{{ $item->sla_resolution_hours }}"
                                        data-notes="{{ $item->notes }}">
                                        Edit
                                    </button>
                                    <form action="{{ route('vendor-contracts.destroy', $item) }}" method="POST" class="d-inline" onsubmit="return confirm('Hapus data ini?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="6" class="text-center text-muted">Belum ada data.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- Modal create --}}
    <div class="modal fade" id="createVendorModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Tambah Vendor / Kontrak</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('vendor-contracts.store') }}" method="POST">
                    @csrf
                    @include('masters.vendor_form', ['values' => []])
                </form>
            </div>
        </div>
    </div>

    {{-- Modal edit --}}
    <div class="modal fade" id="editVendorModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Vendor / Kontrak</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editVendorForm" method="POST">
                    @csrf
                    @method('PUT')
                    @include('masters.vendor_form', ['values' => []])
                </form>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
<script>
    const editVendorModal = document.getElementById('editVendorModal');
    if (editVendorModal) {
        const updateRouteTemplate = "{{ route('vendor-contracts.update', ['vendor_contract' => '__ID__']) }}";
        editVendorModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const form = document.getElementById('editVendorForm');
            form.action = updateRouteTemplate.replace('__ID__', button.getAttribute('data-id'));

            form.querySelector('[name="vendor_name"]').value = button.getAttribute('data-vendor_name') || '';
            form.querySelector('[name="contract_number"]').value = button.getAttribute('data-contract_number') || '';
            form.querySelector('[name="start_date"]').value = button.getAttribute('data-start_date') || '';
            form.querySelector('[name="end_date"]').value = button.getAttribute('data-end_date') || '';
            form.querySelector('[name="sla_response_hours"]').value = button.getAttribute('data-sla_response_hours') || '';
            form.querySelector('[name="sla_resolution_hours"]').value = button.getAttribute('data-sla_resolution_hours') || '';
            form.querySelector('[name="notes"]').value = button.getAttribute('data-notes') || '';
        });
    }
</script>
@endsection
