
@extends('layouts.custom-master')

@php
// Passing the bodyClass variable from the view to the layout
$bodyClass = 'bg-white';
@endphp

@section('styles')



@endsection

@section('content')
	
        <div class="row mx-0 min-vh-100">
            <div class="col-lg-6 d-flex align-items-center justify-content-center">
                <div class="card custom-card shadow-none border-0 w-100" style="max-width: 520px;">
                    <div class="card-body p-5">
                        <div class="mb-4">
                            <div class="d-inline-flex align-items-center gap-2 text-default badge bg-primary-transparent border fs-13 rounded-pill">
                                <i class="ri-qr-code-line"></i> Asset Management
                            </div>
                            <h3 class="mt-3 fw-semibold">Masuk ke Dashboard</h3>
                            <p class="text-muted mb-0">Kelola aset, maintenance, audit, dan laporan dalam satu sistem.</p>
                        </div>
                        <form method="POST" action="{{ route('login') }}" class="row gy-3">
                            @csrf
                            <div class="col-12">
                                <label for="signin-email" class="form-label text-default">Email</label>
                                <input type="email" name="email" class="form-control @error('email') is-invalid @enderror" id="signin-email" placeholder="you@example.com" value="{{ old('email') }}" required autofocus>
                                @error('email') <span class="invalid-feedback">{{ $message }}</span> @enderror
                            </div>
                            <div class="col-12">
                                <label for="signin-password" class="form-label text-default d-block">Password</label>
                                <div class="position-relative">
                                    <input type="password" name="password" class="form-control @error('password') is-invalid @enderror" id="signin-password" placeholder="Password" required>
                                    <a href="javascript:void(0);" class="show-password-button text-muted" onclick="createpassword('signin-password',this)" id="button-addon2"><i class="ri-eye-off-line align-middle"></i></a>
                                    @error('password') <span class="invalid-feedback">{{ $message }}</span> @enderror
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="1" name="remember" id="rememberCheck">
                                        <label class="form-check-label" for="rememberCheck">Ingat saya</label>
                                    </div>
                                    <a href="javascript:void(0);" class="link-primary fw-medium fs-12">Lupa password?</a>
                                </div>
                            </div>
                            <div class="col-12 d-grid">
                                <button type="submit" class="btn btn-primary btn-wave">Masuk</button>
                            </div>
                        </form>
                        <div class="text-center mt-4 fw-medium">
                            Belum punya akun? <a href="{{ route('register') }}" class="text-primary">Daftar sekarang</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6 p-0 d-none d-lg-block">
                <div class="h-100 w-100 position-relative">
                    <img src="{{ asset('auth-asset-cover.jpg') }}" alt="Asset cover" class="h-100 w-100 object-fit-cover">
                    <div class="position-absolute bottom-0 start-0 end-0 p-4 bg-dark bg-opacity-50 text-fixed-white">
                        <h4 class="fw-semibold mb-1">Sistem Manajemen Aset</h4>
                        <p class="mb-0 text-fixed-white-7">QR aset, movement, disposal, maintenance, audit, dan laporan siap unduh.</p>
                    </div>
                </div>
            </div>
        </div>

@endsection

@section('scripts')
	
        <!-- Show Password JS -->
        <script src="{{asset('build/assets/show-password.js')}}"></script>

@endsection
