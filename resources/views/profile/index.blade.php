@extends('layouts.master')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-3 page-header-breadcrumb">
    <div>
        <h1 class="page-title fw-medium fs-20 mb-0">Profil Saya</h1>
        <p class="text-muted mb-0">Kelola profil, keamanan, dan preferensi Anda.</p>
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

<div class="row g-3">
    <div class="col-xl-6">
        <div class="card custom-card">
            <div class="card-header"><div class="card-title mb-0">Informasi Profil</div></div>
            <div class="card-body">
                <form method="POST" action="{{ route('profile.update') }}" class="row g-3">
                    @csrf
                    @method('PUT')
                    <div class="col-12">
                        <label class="form-label">Nama</label>
                        <input type="text" name="name" class="form-control" value="{{ old('name', $user->name) }}" required>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" class="form-control" value="{{ old('email', $user->email) }}" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Departemen</label>
                        <select name="department_id" class="form-select">
                            <option value="">-- Pilih --</option>
                            @foreach($departments as $dept)
                                <option value="{{ $dept->id }}" @selected(old('department_id', $user->department_id)==$dept->id)>{{ $dept->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Lokasi</label>
                        <select name="asset_location_id" class="form-select">
                            <option value="">-- Pilih --</option>
                            @foreach($locations as $loc)
                                <option value="{{ $loc->id }}" @selected(old('asset_location_id', $user->asset_location_id)==$loc->id)>{{ $loc->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-12">
                        <button class="btn btn-primary">Simpan Profil</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-xl-6">
        <div class="card custom-card">
            <div class="card-header"><div class="card-title mb-0">Ubah Kata Sandi</div></div>
            <div class="card-body">
                <form method="POST" action="{{ route('profile.password') }}" class="row g-3">
                    @csrf
                    @method('PUT')
                    <div class="col-12">
                        <label class="form-label">Kata sandi saat ini</label>
                        <input type="password" name="current_password" class="form-control" required>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Kata sandi baru</label>
                        <input type="password" name="password" class="form-control" required>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Konfirmasi kata sandi</label>
                        <input type="password" name="password_confirmation" class="form-control" required>
                    </div>
                    <div class="col-12">
                        <button class="btn btn-primary">Update Kata Sandi</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="card custom-card mt-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <div class="card-title mb-0">Keamanan 2FA</div>
                    <div class="text-muted small">Aktifkan OTP berbasis aplikasi authenticator.</div>
                </div>
                @if($user->two_factor_enabled)
                    <span class="badge bg-success">Aktif</span>
                @elseif($user->two_factor_secret)
                    <span class="badge bg-warning">Menunggu konfirmasi</span>
                @else
                    <span class="badge bg-secondary">Nonaktif</span>
                @endif
            </div>
            <div class="card-body">
                @if(!$user->two_factor_secret)
                    <form method="POST" action="{{ route('profile.2fa.setup') }}">
                        @csrf
                        <button class="btn btn-outline-primary">Siapkan 2FA</button>
                    </form>
                @elseif(!$user->two_factor_enabled)
                    <p class="text-muted small mb-2">Scan URL berikut di aplikasi authenticator, lalu masukkan kode 6 digit untuk mengaktifkan.</p>
                    <div class="alert alert-secondary">
                        <div class="fw-semibold">Secret</div>
                        <div class="text-monospace">{{ $user->two_factor_secret }}</div>
                        @if($otpUrl)
                            <div class="fw-semibold mt-2">OTP URL</div>
                            <div class="small text-break">{{ $otpUrl }}</div>
                        @endif
                    </div>
                    <form method="POST" action="{{ route('profile.2fa.confirm') }}" class="row g-2">
                        @csrf
                        <div class="col-8">
                            <input type="text" name="code" class="form-control" placeholder="Kode 6 digit">
                        </div>
                        <div class="col-4">
                            <button class="btn btn-primary w-100">Konfirmasi</button>
                        </div>
                    </form>
                    <form method="POST" action="{{ route('profile.2fa.disable') }}" class="mt-2">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-outline-danger btn-sm">Batalkan</button>
                    </form>
                @else
                    <p class="text-muted small mb-2">Simpan kode pemulihan berikut dengan aman.</p>
                    <div class="d-flex flex-wrap gap-2 mb-2">
                        @foreach((array) $user->two_factor_recovery_codes as $code)
                            <span class="badge bg-light text-dark border">{{ $code }}</span>
                        @endforeach
                    </div>
                    <form method="POST" action="{{ route('profile.2fa.disable') }}">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-outline-danger">Nonaktifkan 2FA</button>
                    </form>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection
