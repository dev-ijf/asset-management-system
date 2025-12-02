@extends('layouts.custom-master')

@php
$bodyClass = 'bg-white';
@endphp

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card custom-card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <div class="badge bg-primary-transparent text-primary border rounded-pill mb-2">Setup Wizard</div>
                            <h3 class="fw-semibold mb-0">Langkah {{ $step }} dari 4</h3>
                            <p class="text-muted mb-0">Siapkan akun, setting, master data, lalu aset pertama.</p>
                        </div>
                    </div>

                    @if(session('success'))
                        <div class="alert alert-success">{{ session('success') }}</div>
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

                    <div class="progress mb-4" style="height: 6px;">
                        <div class="progress-bar" role="progressbar" style="width: {{ ($step/4)*100 }}%"></div>
                    </div>

                    @if($step === 1)
                        <form method="POST" action="{{ route('setup.store') }}">
                            @csrf
                            <input type="hidden" name="step" value="1">
                            <div class="mb-3">
                                <label class="form-label">Nama</label>
                                <input type="text" name="name" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" name="email" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" name="password" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Konfirmasi Password</label>
                                <input type="password" name="password_confirmation" class="form-control" required>
                            </div>
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-primary">Lanjut</button>
                            </div>
                        </form>
                    @elseif($step === 2)
                        <form method="POST" action="{{ route('setup.store') }}">
                            @csrf
                            <input type="hidden" name="step" value="2">
                            <p class="text-muted">Sesuaikan konfigurasi awal. Nilai diambil dari seeder dan dapat diubah.</p>
                            @foreach($settings->groupBy('group') as $group => $items)
                                <div class="border rounded p-3 mb-3">
                                    <h6 class="fw-semibold text-uppercase text-muted mb-2">{{ $group }}</h6>
                                    <div class="row g-3">
                                        @foreach($items as $setting)
                                            <div class="col-md-6">
                                                <label class="form-label">{{ str_replace(['.', '_'], ' ', $setting->key) }}</label>
                                                @if($setting->type === 'boolean')
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="checkbox" name="settings[{{ $setting->key }}]" value="1" id="setting_{{ $setting->id }}" {{ $setting->value ? 'checked' : '' }}>
                                                        <label class="form-check-label" for="setting_{{ $setting->id }}">Aktif</label>
                                                    </div>
                                                @else
                                                    <input
                                                        type="{{ $setting->type === 'integer' ? 'number' : 'text' }}"
                                                        name="settings[{{ $setting->key }}]"
                                                        class="form-control"
                                                        value="{{ old('settings.'.$setting->key, $setting->value) }}"
                                                    >
                                                @endif
                                                @if(!empty($setting->description))
                                                    <small class="text-muted d-block">{{ $setting->description }}</small>
                                                @endif
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @endforeach
                            <div class="d-flex justify-content-between">
                                <a href="{{ route('setup.index', ['step' => 1]) }}" class="btn btn-outline-secondary">Kembali</a>
                                <button class="btn btn-primary">Lanjut</button>
                            </div>
                        </form>
                    @elseif($step === 3)
                        <div class="mb-3 text-muted">Langkah ini akan membuat master data dasar (status, kelas, kategori, unit, dept, PIC, lokasi, garansi).</div>
                        <form method="POST" action="{{ route('setup.store') }}">
                            @csrf
                            <input type="hidden" name="step" value="3">
                            <div class="d-flex justify-content-between">
                                <a href="{{ route('setup.index', ['step' => 2]) }}" class="btn btn-outline-secondary">Kembali</a>
                                <button class="btn btn-primary">Generate Master Data</button>
                            </div>
                        </form>
                    @elseif($step === 4)
                        <form method="POST" action="{{ route('setup.store') }}">
                            @csrf
                            <input type="hidden" name="step" value="4">
                            <div class="mb-3">
                                <label class="form-label">Nama Aset Sample</label>
                                <input type="text" name="asset_name" class="form-control" value="Asset Sample" required>
                            </div>
                            <div class="d-flex justify-content-between">
                                <a href="{{ route('setup.index', ['step' => 3]) }}" class="btn btn-outline-secondary">Kembali</a>
                                <button class="btn btn-success">Selesaikan Setup</button>
                            </div>
                        </form>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
