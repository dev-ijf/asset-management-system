@extends('layouts.landing-master')

@section('content')
    <section class="section" id="home">
        <div class="container">
            <div class="row g-4 align-items-start">
                <div class="col-lg-6">
                    <div
                        class="d-inline-flex align-items-center gap-2 text-default badge bg-white border fs-13 rounded-pill">
                        <span class="avatar avatar-xs avatar-rounded bg-warning"><i
                                class="ri-qr-code-fill fs-14"></i></span>Asset Detail
                    </div>
                    <h1 class="fw-semibold mt-3 mb-2">{{ $asset->code }}</h1>
                    <p class="fs-18 text-muted mb-3">{{ $asset->name }}</p>
                    <div class="mb-3">
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered mb-0">
                                <tbody>
                                    <tr>
                                        <th>Status</th>
                                        <td>{{ $asset->status?->name ?: '-' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Kategori</th>
                                        <td>{{ $asset->category?->name ?: '-' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Lokasi</th>
                                        <td>{{ $asset->location?->name ?: '-' }}</td>
                                    </tr>
                                    <tr>
                                        <th>PIC</th>
                                        <td>{{ $asset->personInCharge?->name ?: '-' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Pengguna</th>
                                        <td>{{ $asset->user?->name ?: '-' }}</td>
                                    </tr>
                                    <tr>
                                        <th>Garansi</th>
                                        <td>{{ $asset->warranty?->name ?: '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    @auth
                        <div class="btn-list">
                            @can('movements.manage')
                                <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#modalMovement">Movement</button>
                            @endcan
                            @can('disposals.manage')
                                <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#modalDisposal">Disposal</button>
                            @endcan
                            @can('maintenance.manage')
                                <button class="btn btn-outline-success" data-bs-toggle="modal" data-bs-target="#modalMaintenance">Maintenance</button>
                            @endcan
                        </div>
                    @else
                        <p class="text-muted">Untuk melakukan transaksi (movement/disposal/maintenance), silakan <a
                                href="{{ route('login') }}">login</a>.</p>
                    @endauth
                </div>
                <div class="col-lg-6">
                    <div class="card custom-card">
                        <div class="card-body">
                            @php $firstPhoto = $asset->photos->first(); @endphp
                            <div class="mb-3 text-center">
                                <img id="main-asset-photo"
                                    src="{{ $firstPhoto ? asset('storage/' . $firstPhoto->path) : asset('landing-asset-hero.jpg') }}"
                                    alt="foto aset" class="img-fluid rounded" style="height:320px;object-fit:cover;">
                            </div>
                            <div class="d-flex gap-2 flex-wrap justify-content-center">
                                @forelse($asset->photos as $photo)
                                    <button class="thumb-btn border-0 p-0 bg-transparent"
                                        data-src="{{ asset('storage/' . $photo->path) }}">
                                        <img src="{{ asset('storage/' . $photo->path) }}"
                                            class="img-thumbnail {{ $loop->first ? 'border border-2 border-primary' : '' }}"
                                            style="width:90px;height:90px;object-fit:cover;" alt="foto aset">
                                    </button>
                                @empty
                                    <span class="text-muted small">Belum ada foto aset.</span>
                                @endforelse
                            </div>
                        </div>
                    </div>
                    @guest
                        <div class="card custom-card mt-3">
                            <div class="card-body">
                                <p class="mb-0 text-muted">Untuk melakukan transaksi movement/disposal/maintenance dari sini, silakan <a href="{{ route('login') }}">login</a> terlebih dahulu.</p>
                            </div>
                        </div>
                    @endguest
                </div>
            </div>
        </div>
    </section>

    {{-- Modals transaksi --}}
    @auth
        @can('movements.manage')
        <div class="modal fade" id="modalMovement" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Movement Aset</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form method="POST" action="{{ route('assets.public.movements.store', $asset) }}" class="row g-2">
                        @csrf
                        <div class="modal-body">
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label">Lokasi Tujuan</label>
                                    <select name="to_location_id" class="form-select">
                                        <option value="">-- Pilih --</option>
                                        @foreach(\App\Models\AssetLocation::orderBy('name')->get() as $loc)
                                            <option value="{{ $loc->id }}">{{ $loc->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Departemen Tujuan</label>
                                    <select name="to_department_id" class="form-select">
                                        <option value="">-- Pilih --</option>
                                        @foreach(\App\Models\Department::orderBy('name')->get() as $dept)
                                            <option value="{{ $dept->id }}">{{ $dept->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Pengguna Tujuan</label>
                                    <select name="to_asset_user_id" class="form-select">
                                        <option value="">-- Pilih --</option>
                                        @foreach(\App\Models\AssetUser::orderBy('name')->get() as $au)
                                            <option value="{{ $au->id }}">{{ $au->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Catatan</label>
                                    <input type="text" name="notes" class="form-control" placeholder="Catatan movement">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                            <button class="btn btn-primary">Simpan Movement</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        @endcan

        @can('disposals.manage')
        <div class="modal fade" id="modalDisposal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Disposal Aset</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form method="POST" action="{{ route('assets.public.disposals.store', $asset) }}" class="row g-2">
                        @csrf
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Alasan</label>
                                <input type="text" name="reason" class="form-control" required placeholder="Alasan disposal">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Catatan</label>
                                <textarea name="notes" class="form-control" rows="2" placeholder="Catatan tambahan"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                            <button class="btn btn-danger">Simpan Disposal</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        @endcan

        @can('maintenance.manage')
        <div class="modal fade" id="modalMaintenance" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Maintenance Aset</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form method="POST" action="{{ route('assets.public.maintenances.store', $asset) }}" class="row g-2">
                        @csrf
                        <div class="modal-body">
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label">Tanggal</label>
                                    <input type="date" name="performed_at" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Vendor</label>
                                    <input type="text" name="vendor" class="form-control" placeholder="Nama vendor">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Deskripsi</label>
                                    <input type="text" name="description" class="form-control" required placeholder="Pekerjaan maintenance">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Biaya</label>
                                    <input type="number" step="0.01" name="cost" class="form-control" placeholder="0.00">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Catatan</label>
                                    <textarea name="notes" class="form-control" rows="2" placeholder="Catatan tambahan"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                            <button class="btn btn-success">Simpan Maintenance</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        @endcan
    @endauth
@endsection



@section('scripts')
    <script>
        document.querySelectorAll('.thumb-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const main = document.getElementById('main-asset-photo');
                main.src = this.dataset.src;
                document.querySelectorAll('.thumb-btn img').forEach(img => img.classList.remove(
                    'border-primary', 'border', 'border-2'));
                this.querySelector('img').classList.add('border', 'border-2', 'border-primary');
            });
        });
    </script>
    @auth
    <script>
        // reset modal forms on hide to avoid stale values
        ['modalMovement','modalDisposal','modalMaintenance'].forEach(id => {
            const modalEl = document.getElementById(id);
            if (!modalEl) return;
            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.querySelectorAll('input, textarea, select').forEach(el => {
                    if (el.tagName === 'SELECT') el.value = '';
                    else el.value = '';
                });
            });
        });
    </script>
    @endauth
@endsection
