@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">{{ $asset->code }}</h1>
            <p class="text-muted mb-0">{{ $asset->name }}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
            @if($asset->qr_path)
                <a href="{{ asset('storage/'.$asset->qr_path) }}" class="btn btn-outline-primary" target="_blank">Download QR</a>
            @endif
            <a href="{{ route('assets.index') }}" class="btn btn-outline-secondary btn-wave">Kembali</a>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-xl-8">
            <div class="card custom-card">
                <div class="card-header">
                    <div class="card-title mb-0">Detail Aset</div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered text-nowrap mb-0">
                            <tbody>
                                <tr><th>Kode</th><td>{{ $asset->code }}</td></tr>
                                <tr><th>Nama</th><td>{{ $asset->name }}</td></tr>
                                <tr><th>Status</th><td>{{ $asset->status?->name ?: '-' }}</td></tr>
                                <tr><th>Kelas</th><td>{{ $asset->class?->name ?: '-' }}</td></tr>
                                <tr><th>Kategori</th><td>{{ $asset->category?->name ?: '-' }}</td></tr>
                                <tr><th>Lokasi</th><td>{{ $asset->location?->name ?: '-' }}</td></tr>
                                <tr><th>Departemen</th><td>{{ $asset->department?->name ?: '-' }}</td></tr>
                                <tr><th>Penanggung Jawab</th><td>{{ $asset->personInCharge?->name ?: '-' }}</td></tr>
                                <tr><th>Pengguna</th><td>{{ $asset->user?->name ?: '-' }}</td></tr>
                                <tr><th>Garansi</th><td>{{ $asset->warranty?->name ?: '-' }}</td></tr>
                                <tr><th>Akhir Garansi</th><td>{{ optional($asset->warranty_end)->format('d/m/Y') ?: '-' }}</td></tr>
                                <tr><th>Serial Number</th><td>{{ $asset->serial_number ?: '-' }}</td></tr>
                                <tr><th>Deskripsi</th><td>{{ $asset->description ?: '-' }}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-4">
            <div class="card custom-card h-100">
                <div class="card-header">
                    <div class="card-title mb-0">QR Aset</div>
                </div>
                <div class="card-body text-center">
                    @if($asset->qr_path)
                        <img src="{{ asset('storage/'.$asset->qr_path) }}" alt="QR {{ $asset->code }}" class="img-fluid mb-3">
                    @else
                        <p class="text-muted mb-3">QR belum tersedia.</p>
                    @endif
                    <p class="mb-0"><code>{{ route('assets.show', $asset) }}</code></p>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mt-2">
        <div class="col-xl-6">
            <div class="card custom-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="card-title mb-0">Movement</div>
                </div>
                <div class="card-body">
                    <form action="{{ route('assets.movements.store', $asset) }}" method="POST" class="mb-3">
                        @csrf
                        <div class="row g-2">
                            <div class="col-md-4">
                                <label class="form-label">Lokasi Tujuan</label>
                                <select name="to_location_id" class="form-select">
                                    <option value="">-- Pilih --</option>
                                    @foreach(\App\Models\AssetLocation::orderBy('name')->get() as $loc)
                                        <option value="{{ $loc->id }}">{{ $loc->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Departemen Tujuan</label>
                                <select name="to_department_id" class="form-select">
                                    <option value="">-- Pilih --</option>
                                    @foreach(\App\Models\Department::orderBy('name')->get() as $dept)
                                        <option value="{{ $dept->id }}">{{ $dept->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Pengguna Tujuan</label>
                                <select name="to_asset_user_id" class="form-select">
                                    <option value="">-- Pilih --</option>
                                    @foreach(\App\Models\AssetUser::orderBy('name')->get() as $user)
                                        <option value="{{ $user->id }}">{{ $user->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-12">
                                <label class="form-label">Catatan</label>
                                <textarea name="notes" class="form-control" rows="2" placeholder="Catatan perpindahan"></textarea>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary btn-wave" type="submit">Catat Movement</button>
                        </div>
                    </form>
                    <div class="table-responsive">
                        <table class="table table-bordered text-nowrap align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Waktu</th>
                                    <th>Dari</th>
                                    <th>Ke</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($asset->movements()->latest()->get() as $movement)
                                    <tr>
                                        <td>{{ optional($movement->performed_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                        <td>
                                            {{ $movement->fromLocation?->name ?: '-' }} / {{ $movement->fromDepartment?->name ?: '-' }} / {{ $movement->fromUser?->name ?: '-' }}
                                        </td>
                                        <td>
                                            {{ $movement->toLocation?->name ?: '-' }} / {{ $movement->toDepartment?->name ?: '-' }} / {{ $movement->toUser?->name ?: '-' }}
                                        </td>
                                        <td>{{ $movement->notes ?: '-' }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4" class="text-center text-muted">Belum ada movement.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xl-6">
            <div class="card custom-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="card-title mb-0">Disposal</div>
                </div>
                <div class="card-body">
                    <form action="{{ route('assets.disposals.store', $asset) }}" method="POST" class="mb-3">
                        @csrf
                        <div class="row g-2">
                            <div class="col-md-12">
                                <label class="form-label">Alasan</label>
                                <input type="text" name="reason" class="form-control" required placeholder="Contoh: rusak berat">
                            </div>
                            <div class="col-md-12">
                                <label class="form-label">Catatan</label>
                                <textarea name="notes" class="form-control" rows="2" placeholder="Catatan disposal"></textarea>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-danger btn-wave" type="submit">Catat Disposal</button>
                        </div>
                    </form>
                    <div class="table-responsive">
                        <table class="table table-bordered text-nowrap align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Waktu</th>
                                    <th>Alasan</th>
                                    <th>Catatan</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($asset->disposals()->latest()->get() as $disposal)
                                    <tr>
                                        <td>{{ optional($disposal->disposed_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                        <td>{{ $disposal->reason ?: '-' }}</td>
                                        <td>{{ $disposal->notes ?: '-' }}</td>
                                        <td>
                                            @if(!$disposal->reversed_at)
                                                <form action="{{ route('assets.disposals.reverse', $disposal) }}" method="POST" class="d-inline">
                                                    @csrf
                                                    <input type="hidden" name="notes" value="Reverse via UI">
                                                    <button class="btn btn-sm btn-outline-success">Reverse</button>
                                                </form>
                                            @else
                                                <span class="badge bg-success-transparent text-success">Reversed</span>
                                            @endif
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4" class="text-center text-muted">Belum ada disposal.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mt-2">
        <div class="col-xl-6">
            <div class="card custom-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="card-title mb-0">Audit Aset</div>
                </div>
                <div class="card-body">
                    <form action="{{ route('assets.audits.store', $asset) }}" method="POST" class="mb-3">
                        @csrf
                        <div class="row g-2">
                            <div class="col-md-4">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select" required>
                                    <option value="matched">Sesuai</option>
                                    <option value="missing">Tidak ditemukan</option>
                                    <option value="damaged">Rusak</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Lokasi Audit</label>
                                <select name="location_id" class="form-select">
                                    <option value="">-- Pilih --</option>
                                    @foreach(\App\Models\AssetLocation::orderBy('name')->get() as $loc)
                                        <option value="{{ $loc->id }}">{{ $loc->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Tanggal Audit</label>
                                <input type="date" name="audited_at" class="form-control" value="{{ now()->toDateString() }}">
                            </div>
                            <div class="col-md-12">
                                <label class="form-label">Catatan</label>
                                <textarea name="notes" class="form-control" rows="2" placeholder="Catatan hasil audit"></textarea>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-success btn-wave" type="submit">Catat Audit</button>
                        </div>
                    </form>
                    <div class="table-responsive">
                        <table class="table table-bordered text-nowrap align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Waktu</th>
                                    <th>Status</th>
                                    <th>Lokasi</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($asset->audits()->latest()->get() as $audit)
                                    <tr>
                                        <td>{{ optional($audit->audited_at)->format('d/m/Y H:i') ?: '-' }}</td>
                                        <td><span class="badge bg-info-transparent text-info">{{ ucfirst($audit->status) }}</span></td>
                                        <td>{{ $audit->location?->name ?: '-' }}</td>
                                        <td>{{ $audit->notes ?: '-' }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4" class="text-center text-muted">Belum ada audit.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
