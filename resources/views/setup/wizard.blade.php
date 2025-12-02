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
                            <div class="mb-3">
                                <label class="form-label">Nama Perusahaan</label>
                                <input type="text" name="company_name" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Timezone</label>
                                <input type="text" name="timezone" class="form-control" value="Asia/Jakarta" required>
                            </div>
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
