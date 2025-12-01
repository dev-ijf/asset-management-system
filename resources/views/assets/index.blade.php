@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Data Aset</h1>
            <p class="text-muted mb-0">Kelola aset, QR token, dan metadata terkait.</p>
        </div>
        <button class="btn btn-primary btn-wave" data-bs-toggle="modal" data-bs-target="#createAssetModal">
            <i class="ri-add-line me-1"></i>Tambah Aset
        </button>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Daftar Aset</div>
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
                <table class="table table-bordered align-middle text-nowrap">
                    <thead class="table-light">
                        <tr>
                            <th>Kode</th>
                            <th>Nama</th>
                            <th>Status</th>
                            <th>Kategori</th>
                            <th>Lokasi</th>
                            <th>QR Token</th>
                            <th class="text-center" style="width: 10%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($assets as $asset)
                            <tr>
                                <td class="fw-semibold">{{ $asset->code }}</td>
                                <td>{{ $asset->name }}</td>
                                <td><span class="badge bg-primary-transparent text-primary">{{ $asset->status?->name ?: '-' }}</span></td>
                                <td>{{ $asset->category?->name ?: '-' }}</td>
                                <td>{{ $asset->location?->name ?: '-' }}</td>
                                <td><code>{{ $asset->qr_token }}</code></td>
                                <td class="text-center">
                                    <div class="btn-list">
                                        <button class="btn btn-sm btn-outline-primary"
                                            data-bs-toggle="modal" data-bs-target="#editAssetModal"
                                            data-id="{{ $asset->id }}"
                                            data-payload='@json($asset->toArray())'>
                                            Edit
                                        </button>
                                        <a href="{{ route('assets.show', $asset) }}" class="btn btn-sm btn-outline-success">Show</a>
                                        <a href="{{ route('assets.history', $asset) }}" class="btn btn-sm btn-outline-secondary">History</a>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center text-muted">Belum ada aset.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- Modal create --}}
    <div class="modal fade" id="createAssetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Tambah Aset</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('assets.store') }}" method="POST">
                    @csrf
                    <div class="modal-body">
                        @include('assets.partials.form')
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Modal edit --}}
    <div class="modal fade" id="editAssetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Aset</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editAssetForm" method="POST">
                    @csrf
                    @method('PUT')
                    <div class="modal-body">
                        @include('assets.partials.form')
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
<script>
    const editAssetModal = document.getElementById('editAssetModal');
    if (editAssetModal) {
        editAssetModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const form = document.getElementById('editAssetForm');
            const payload = JSON.parse(button.getAttribute('data-payload') || '{}');

            form.action = "{{ url('assets') }}/" + button.getAttribute('data-id');

            const simpleFields = [
                'name','serial_number','description','asset_status_id','asset_class_id','asset_category_id',
                'unit_id','department_id','person_in_charge_id','asset_user_id','asset_location_id',
                'warranty_id','purchase_date','warranty_end','cost'
            ];

            simpleFields.forEach((field) => {
                const el = form.querySelector(`[name="${field}"]`);
                if (!el) return;
                el.value = payload[field] ?? '';
            });

            // metadata not editable via modal here (bisa ditambah kemudian)
        });
    }
</script>
@endsection
