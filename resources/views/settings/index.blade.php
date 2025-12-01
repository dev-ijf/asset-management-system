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
                </div>
                <div class="card-body">
                    @forelse($settingsByGroup as $group => $items)
                        <div class="mb-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <h6 class="mb-2 text-uppercase text-muted">{{ $group ?: 'general' }}</h6>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-bordered align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width: 25%;">Key</th>
                                            <th style="width: 25%;">Nilai Aktif</th>
                                            <th style="width: 20%;">Tipe</th>
                                            <th style="width: 30%;">Keterangan</th>
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
@endsection
