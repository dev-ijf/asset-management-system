
@extends('layouts.custom-master')

@php
// Passing the bodyClass variable from the view to the layout
$bodyClass = 'bg-white';
@endphp

@section('styles')



@endsection

@section('content')
	
        <div class="row authentication authentication-cover-main mx-0">
            <div class="col-lg-6 d-flex align-items-center justify-content-center">
                <div class="card custom-card shadow-none border-0 w-100" style="max-width: 520px;">
                    <div class="card-body p-5">
                        <div class="mb-4">
                            <div class="d-inline-flex align-items-center gap-2 text-default badge bg-primary-transparent border fs-13 rounded-pill">
                                <i class="ri-qr-code-line"></i> Asset Management
                            </div>
                            <h3 class="mt-3 fw-semibold">Buat Akun Baru</h3>
                            <p class="text-muted mb-0">Daftarkan akun untuk mulai registrasi aset, maintenance, dan audit.</p>
                        </div>
                        <form method="POST" action="{{ route('register') }}" class="row gy-3">
                            @csrf
                            <div class="col-12"> 
                                <label for="signup-name" class="form-label text-default">Nama</label> 
                                <input type="text" name="name" class="form-control @error('name') is-invalid @enderror" id="signup-name" placeholder="Nama lengkap" value="{{ old('name') }}" required> 
                                @error('name') <span class="invalid-feedback">{{ $message }}</span> @enderror
                            </div>
                            <div class="col-12">
                                <label for="signup-email" class="form-label text-default">Email</label>
                                <input type="email" name="email" class="form-control @error('email') is-invalid @enderror" id="signup-email" placeholder="email@contoh.com" value="{{ old('email') }}" required>
                                @error('email') <span class="invalid-feedback">{{ $message }}</span> @enderror
                            </div>
                            <div class="col-12">
                                <label for="signup-password" class="form-label text-default d-block">Password</label>
                                <div class="position-relative">
                                    <input type="password" name="password" class="form-control @error('password') is-invalid @enderror" id="signup-password" placeholder="Password" required>
                                    <a href="javascript:void(0);" class="show-password-button text-muted" onclick="createpassword('signup-password',this)" id="button-addon2"><i class="ri-eye-off-line align-middle"></i></a>
                                    @error('password') <span class="invalid-feedback">{{ $message }}</span> @enderror
                                </div>
                            </div>
                            <div class="col-12">
                                <label for="signup-password-confirm" class="form-label text-default d-block">Konfirmasi Password</label>
                                <input type="password" name="password_confirmation" class="form-control" id="signup-password-confirm" placeholder="Ulangi password" required>
                            </div>
                            <div class="col-12 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="1" id="defaultCheck1" required>
                                    <label class="form-check-label text-muted fw-medium fs-12" for="defaultCheck1">
                                        Saya setuju dengan <a href="javascript:void(0);" class="text-primary fw-semibold link-underline">syarat & ketentuan</a>
                                    </label>
                                </div>
                            </div>
                            <div class="col-12 d-grid">
                                <button type="submit" class="btn btn-primary">Daftar</button>
                            </div>
                        </form>
                        <div class="text-center mt-4 fw-medium">
                            Sudah punya akun? <a href="{{ route('login') }}" class="text-primary">Masuk</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6 p-0 d-none d-lg-block">
                <div class="h-100 w-100 position-relative">
                    <img src="{{ asset('auth-asset-cover.jpg') }}" alt="Asset cover" class="h-100 w-100 object-fit-cover">
                    <div class="position-absolute bottom-0 start-0 end-0 p-4 bg-dark bg-opacity-50 text-fixed-white">
                        <h4 class="fw-semibold mb-1">Bangun repositori aset yang rapi</h4>
                        <p class="mb-0 text-fixed-white-7">Mulai dari registrasi, QR, movement, disposal, maintenance sampai audit.</p>
                    </div>
                </div>
            </div>
        </div>

@endsection

@section('scripts')
        
        <!-- Show Password JS -->
        <script src="{{asset('build/assets/show-password.js')}}"></script>

@endsection
