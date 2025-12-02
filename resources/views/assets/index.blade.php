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
            <form method="GET" class="mb-3">
                <div class="row g-2">
                    <div class="col-md-3">
                        <input type="text" name="q" class="form-control" placeholder="Cari kode/nama/SN" value="{{ $filters['q'] ?? '' }}">
                    </div>
                    <div class="col-md-2">
                        <select name="asset_status_id" class="form-select">
                            <option value="">Status</option>
                            @foreach($statuses as $item)
                                <option value="{{ $item->id }}" @selected(($filters['asset_status_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select name="asset_class_id" class="form-select">
                            <option value="">Kelas</option>
                            @foreach($classes as $item)
                                <option value="{{ $item->id }}" @selected(($filters['asset_class_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select name="asset_category_id" class="form-select">
                            <option value="">Kategori</option>
                            @foreach($categories as $item)
                                <option value="{{ $item->id }}" @selected(($filters['asset_category_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="asset_location_id" class="form-select">
                            <option value="">Lokasi</option>
                            @foreach($locations as $item)
                                <option value="{{ $item->id }}" @selected(($filters['asset_location_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="department_id" class="form-select">
                            <option value="">Departemen</option>
                            @foreach($departments as $item)
                                <option value="{{ $item->id }}" @selected(($filters['department_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="asset_user_id" class="form-select">
                            <option value="">Pengguna</option>
                            @foreach($users as $item)
                                <option value="{{ $item->id }}" @selected(($filters['asset_user_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="person_in_charge_id" class="form-select">
                            <option value="">Person in Charge</option>
                            @foreach($peopleInCharge as $item)
                                <option value="{{ $item->id }}" @selected(($filters['person_in_charge_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="warranty_id" class="form-select">
                            <option value="">Garansi</option>
                            @foreach($warranties as $item)
                                <option value="{{ $item->id }}" @selected(($filters['warranty_id'] ?? '') == $item->id)>{{ $item->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-12 d-flex gap-2">
                        <button type="submit" class="btn btn-primary btn-wave">Filter</button>
                        <a href="{{ route('assets.index') }}" class="btn btn-outline-secondary">Reset</a>
                    </div>
                </div>
            </form>
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
            <div class="mt-3">
                {{ $assets->links() }}
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
        const updateRouteTemplate = "{{ route('assets.update', ['asset' => '__ID__']) }}";
        editAssetModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const form = document.getElementById('editAssetForm');
            const payload = JSON.parse(button.getAttribute('data-payload') || '{}');

            form.action = updateRouteTemplate.replace('__ID__', button.getAttribute('data-id'));

            const simpleFields = [
                'name','serial_number','description','asset_status_id','asset_class_id','asset_category_id',
                'unit_id','department_id','person_in_charge_id','asset_user_id','asset_location_id',
                'warranty_id','cost'
            ];

            simpleFields.forEach((field) => {
                const el = form.querySelector(`[name="${field}"]`);
                if (!el) return;
                el.value = payload[field] ?? '';
            });

            const dateFields = ['purchase_date','warranty_end'];
            const normalizeDate = (value) => {
                if (!value) return '';
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    return value.slice(0, 10);
                }
                const d = new Date(value);
                return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
            };

            dateFields.forEach((field) => {
                const el = form.querySelector(`[name="${field}"]`);
                if (!el) return;
                el.value = normalizeDate(payload[field]);
            });

            // metadata not editable via modal here (bisa ditambah kemudian)
        });
    }
</script>
@endsection
