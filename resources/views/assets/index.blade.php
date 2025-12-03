@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">Data Aset</h1>
            <p class="text-muted mb-0">Kelola aset, QR token, dan metadata terkait.</p>
        </div>
        <div class="btn-list">
            <a href="{{ route('assets.export', request()->query()) }}" class="btn btn-outline-secondary btn-wave">
                <i class="ri-download-2-line me-1"></i>Export CSV
            </a>
            <button class="btn btn-outline-primary btn-wave" data-bs-toggle="modal" data-bs-target="#importAssetModal">
                <i class="ri-upload-2-line me-1"></i>Import CSV
            </button>
            <button class="btn btn-primary btn-wave" data-bs-toggle="modal" data-bs-target="#createAssetModal">
                <i class="ri-add-line me-1"></i>Tambah Aset
            </button>
        </div>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Daftar Aset</div>
        </div>
        <div class="card-body">
            <form method="GET" class="mb-3">
                <div class="d-flex flex-wrap gap-2 mb-2">
                    @php $scope = $filters['scope'] ?? ''; @endphp
                    <a href="{{ route('assets.index', array_merge(request()->except('scope'), ['scope' => null])) }}" class="btn btn-sm {{ $scope==='' ? 'btn-primary' : 'btn-outline-primary' }}">Aktif</a>
                    <a href="{{ route('assets.index', array_merge(request()->except('scope'), ['scope' => 'archived'])) }}" class="btn btn-sm {{ $scope==='archived' ? 'btn-primary' : 'btn-outline-primary' }}">Arsip</a>
                    <a href="{{ route('assets.index', array_merge(request()->except('scope'), ['scope' => 'trashed'])) }}" class="btn btn-sm {{ $scope==='trashed' ? 'btn-primary' : 'btn-outline-primary' }}">Terhapus</a>
                    <a href="{{ route('assets.index', array_merge(request()->except('scope'), ['scope' => 'all'])) }}" class="btn btn-sm {{ $scope==='all' ? 'btn-primary' : 'btn-outline-primary' }}">Semua</a>
                </div>
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

            @if(!empty($importPreview))
                <div class="alert alert-info">
                    <strong>Preview Import:</strong> Create {{ $importPreview['summary']['create'] ?? 0 }}, Update {{ $importPreview['summary']['update'] ?? 0 }}, Invalid {{ $importPreview['summary']['invalid'] ?? 0 }}.
                    <form class="d-inline" action="{{ route('assets.import') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" name="action" value="import">
                        @if(session()->has('_old_input.file'))
                            {{-- file tidak bisa dipersist di old input; user perlu upload ulang untuk commit --}}
                        @endif
                        <button class="btn btn-sm btn-primary ms-2">Import Sekarang (unggah ulang file yang sama)</button>
                    </form>
                </div>
                <div class="table-responsive mb-3">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Status</th>
                                <th>Nama</th>
                                <th>Kode</th>
                                <th>SN</th>
                                <th>RFID</th>
                                <th>NFC</th>
                                <th>Qty</th>
                                <th>Catatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($importPreview['rows'] as $row)
                                <tr>
                                    <td>{{ $row['line'] }}</td>
                                    <td>
                                        @if($row['status']==='invalid')
                                            <span class="badge bg-danger">Invalid</span>
                                        @elseif($row['status']==='update')
                                            <span class="badge bg-warning text-dark">Update</span>
                                        @else
                                            <span class="badge bg-success">Create</span>
                                        @endif
                                    </td>
                                    <td>{{ $row['payload']['name'] ?? '-' }}</td>
                                    <td>{{ $row['payload']['code'] ?? '-' }}</td>
                                    <td>{{ $row['payload']['serial_number'] ?? '-' }}</td>
                                    <td>{{ $row['payload']['rfid_tag'] ?? '-' }}</td>
                                    <td>{{ $row['payload']['nfc_tag'] ?? '-' }}</td>
                                    <td>{{ $row['payload']['quantity'] ?? 1 }}</td>
                                    <td class="small text-muted">{{ implode(', ', $row['errors'] ?? []) }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                    <div class="text-muted small">Menampilkan maksimal 50 baris preview.</div>
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
                            <th>RFID/NFC</th>
                            <th>Stok</th>
                            <th class="text-center" style="width: 10%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($assets as $asset)
                            <tr>
                                <td class="fw-semibold">{{ $asset->code }}</td>
                                <td>
                                    {{ $asset->name }}
                                    @if($asset->archived_at)
                                        <span class="badge bg-warning text-dark ms-1">Arsip</span>
                                    @endif
                                    @if($asset->trashed())
                                        <span class="badge bg-danger ms-1">Deleted</span>
                                    @endif
                                </td>
                                <td><span class="badge bg-primary-transparent text-primary">{{ $asset->status?->name ?: '-' }}</span></td>
                                <td>{{ $asset->category?->name ?: '-' }}</td>
                                <td>{{ $asset->location?->name ?: '-' }}</td>
                                <td>
                                    @if($asset->rfid_tag || $asset->nfc_tag)
                                        <div class="small mb-1">RFID: <code>{{ $asset->rfid_tag ?? '-' }}</code></div>
                                        <div class="small">NFC: <code>{{ $asset->nfc_tag ?? '-' }}</code></div>
                                    @else
                                        <span class="text-muted">-</span>
                                    @endif
                                </td>
                                <td>
                                    @if($asset->is_consumable)
                                        <span class="badge bg-warning text-dark">Consumable</span>
                                    @elseif($asset->is_pool)
                                        <span class="badge bg-info text-dark">Pool</span>
                                    @else
                                        <span class="badge bg-secondary-transparent text-secondary">Per Unit</span>
                                    @endif
                                    <div class="small text-muted">Qty: {{ $asset->quantity ?? 1 }} | Ready: {{ $asset->available_quantity ?? $asset->quantity ?? 1 }}</div>
                                </td>
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
                                        @if(!$asset->archived_at)
                                            <form action="{{ route('assets.archive', $asset) }}" method="POST" class="d-inline">
                                                @csrf
                                                <button class="btn btn-sm btn-outline-warning" onclick="return confirm('Arsipkan aset ini?')">Archive</button>
                                            </form>
                                        @else
                                            <form action="{{ route('assets.unarchive', $asset) }}" method="POST" class="d-inline">
                                                @csrf
                                                <button class="btn btn-sm btn-outline-info">Unarchive</button>
                                            </form>
                                        @endif
                                        @if($asset->trashed())
                                            <form action="{{ route('assets.restore', $asset->id) }}" method="POST" class="d-inline">
                                                @csrf
                                                <button class="btn btn-sm btn-outline-primary">Restore</button>
                                            </form>
                                        @else
                                            <form action="{{ route('assets.destroy', $asset) }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('DELETE')
                                                <button class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus (soft delete)?')">Delete</button>
                                            </form>
                                        @endif
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

    {{-- Modal import --}}
    <div class="modal fade" id="importAssetModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Import Aset (CSV/Excel)</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('assets.import') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="modal-body">
                        <p class="text-muted">
                            Unggah file CSV (Excel bisa ekspor ke CSV). Header yang didukung:
                            <code>code,name,serial_number,status,category,location,rfid_tag,nfc_tag,is_consumable,quantity,available_quantity,is_pool,image_url,image_file</code>.
                            Kolom <code>image_url</code> akan di-download; kolom <code>image_file</code> akan dicari di ZIP gambar (opsional). Baris tanpa nama akan ditandai invalid. Contoh file:
                            <a href="{{ asset('samples/assets_import_sample.csv') }}" target="_blank">assets_import_sample.csv</a>
                        </p>
                        <div class="mb-3">
                            <label class="form-label">File</label>
                            <input type="file" name="file" class="form-control" accept=".csv,.txt" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">ZIP Gambar (opsional)</label>
                            <input type="file" name="images_zip" class="form-control" accept=".zip">
                            <small class="text-muted">Isi dengan gambar yang namanya sesuai kolom <code>image_file</code> (misal printer.jpg, tinta.jpg).</small>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="action" id="importPreview" value="preview" checked>
                            <label class="form-check-label" for="importPreview">Preview (tidak menyimpan)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="action" id="importNow" value="import">
                            <label class="form-check-label" for="importNow">Import sekarang (buat/update langsung)</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Proses</button>
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
                'warranty_id','cost','depreciation_method','useful_life_months','residual_value','capex_opex','vendor_contract_id',
                'rfid_tag','nfc_tag','label_template','quantity','available_quantity'
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

            const booleanFields = ['is_consumable','is_pool'];
            booleanFields.forEach((field) => {
                const el = form.querySelector(`[name="${field}"]`);
                if (!el) return;
                el.value = (payload[field] ? '1' : '0');
            });

            // metadata not editable via modal here (bisa ditambah kemudian)
        });
    }
</script>
@endsection
