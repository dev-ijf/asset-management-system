@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">System Settings</h1>
            <p class="text-muted mb-0">Semua konfigurasi yang bisa diubah tanpa redeploy.</p>
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="card custom-card">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <div>
                        <div class="card-title">Daftar Setting</div>
                        <div class="card-subtitle">Nilai yang ditampilkan sudah menerapkan override dari database.</div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-primary btn-wave" data-bs-toggle="modal" data-bs-target="#createSettingModal">
                            <i class="ri-add-line me-1"></i>Tambah Setting
                        </button>
                    </div>
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

                    @forelse($settingsByGroup as $group => $items)
                        <div class="mb-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <h6 class="mb-2 text-uppercase text-muted">{{ $group ?: 'general' }}</h6>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-bordered align-middle text-nowrap mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width: 25%;">Key</th>
                                            <th style="width: 25%;">Nilai Aktif</th>
                                            <th style="width: 20%;">Tipe</th>
                                            <th style="width: 30%;">Keterangan</th>
                                            <th class="text-center" style="width: 10%;">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($items as $setting)
                                            <tr>
                                                <td class="fw-medium">{{ $setting->key }}</td>
                                                <td>
                                                    {{-- Nilai yang ditampilkan sudah di-merge dengan config default --}}
                                                    @php $value = data_get($resolved, $setting->key); @endphp
                                                    @if(is_array($value))
                                                        <pre class="mb-0 small">{{ json_encode($value, JSON_PRETTY_PRINT) }}</pre>
                                                    @else
                                                        <span class="badge bg-primary-transparent text-primary fw-medium">{{ var_export($value, true) }}</span>
                                                    @endif
                                                </td>
                                                <td><span class="badge bg-secondary-transparent text-secondary">{{ $setting->type }}</span></td>
                                                <td class="text-muted">{{ $setting->description ?? '-' }}</td>
                                                <td class="text-center">
                                                    <div class="btn-list">
                                                        <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal"
                                                                data-bs-target="#editSettingModal"
                                                                data-id="{{ $setting->id }}"
                                                                data-key="{{ e($setting->key) }}"
                                                                data-group="{{ e($setting->group) }}"
                                                                data-type="{{ e($setting->type) }}"
                                                                data-description="{{ e($setting->description) }}"
                                                                data-value="{{ e(is_array($setting->value) ? json_encode($setting->value) : $setting->value) }}"
                                                                data-is-public="{{ $setting->is_public ? '1' : '0' }}">
                                                            Edit
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    @empty
                        <div class="alert alert-warning mb-0">
                            Belum ada data setting. Jalankan seeder atau tambahkan via UI.
                        </div>
                    @endforelse
                </div>
            </div>
        </div>
    </div>

    {{-- Modal Tambah --}}
    <div class="modal fade" id="createSettingModal" tabindex="-1" aria-labelledby="createSettingModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="createSettingModalLabel">Tambah Setting</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route('settings.store') }}" method="POST">
                    @csrf
                    <div class="modal-body">
                        @include('settings.partials.form')
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Modal Edit --}}
    <div class="modal fade" id="editSettingModal" tabindex="-1" aria-labelledby="editSettingModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editSettingModalLabel">Edit Setting</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editSettingForm" method="POST">
                    @csrf
                    @method('PUT')
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            Hanya nilai yang dapat diubah. Key, grup, dan tipe mengikuti data awal.
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Key</label>
                            <input type="text" class="form-control" id="editKeyDisplay" readonly>
                            <input type="hidden" name="key" id="editKey">
                        </div>
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Group</label>
                                <input type="text" class="form-control" id="editGroupDisplay" readonly>
                                <input type="hidden" name="group" id="editGroup">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Tipe</label>
                                <input type="text" class="form-control" id="editTypeDisplay" readonly>
                                <input type="hidden" name="type" id="editType">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Public?</label>
                                <input type="text" class="form-control" id="editPublicDisplay" readonly>
                                <input type="hidden" name="is_public" id="editIsPublic" value="0">
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Deskripsi</label>
                            <input type="text" class="form-control" id="editDescriptionDisplay" readonly>
                            <input type="hidden" name="description" id="editDescription">
                        </div>
                        <div class="mt-3">
                            <label class="form-label">Nilai</label>
                            <textarea name="value" class="form-control" id="editValue" rows="4" required placeholder="Isi sesuai tipe"></textarea>
                        </div>
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
    const editModal = document.getElementById('editSettingModal');
    if (editModal) {
        const updateRouteTemplate = "{{ route('settings.update', ['setting' => '__ID__']) }}";
        editModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const form = document.getElementById('editSettingForm');
            const id = button.getAttribute('data-id');

            form.action = updateRouteTemplate.replace('__ID__', id);

            // Isi field form dengan data dari tombol edit.
            const key = button.getAttribute('data-key') || '';
            const group = button.getAttribute('data-group') || '';
            const type = button.getAttribute('data-type') || 'string';
            const description = button.getAttribute('data-description') || '';
            const value = button.getAttribute('data-value') || '';
            const isPublic = button.getAttribute('data-is-public') === '1';

            document.getElementById('editKey').value = key;
            document.getElementById('editKeyDisplay').value = key;
            document.getElementById('editGroup').value = group;
            document.getElementById('editGroupDisplay').value = group;
            document.getElementById('editType').value = type;
            document.getElementById('editTypeDisplay').value = type;
            document.getElementById('editDescription').value = description;
            document.getElementById('editDescriptionDisplay').value = description;
            document.getElementById('editValue').value = value;
            document.getElementById('editIsPublic').value = isPublic ? 1 : 0;
            document.getElementById('editPublicDisplay').value = isPublic ? 'Ya' : 'Tidak';
        });
    }
</script>
@endsection
