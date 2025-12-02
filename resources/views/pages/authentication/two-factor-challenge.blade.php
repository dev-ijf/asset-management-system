@extends('layouts.custom-master')

@php
$bodyClass = 'bg-white';
@endphp

@section('content')
    <div class="row mx-0 min-vh-100">
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
            <div class="card custom-card shadow-none border-0 w-100" style="max-width: 520px;">
                <div class="card-body p-5">
                    <div class="mb-4">
                        <div class="d-inline-flex align-items-center gap-2 text-default badge bg-primary-transparent border fs-13 rounded-pill">
                            <i class="ri-shield-keyhole-line"></i> Verifikasi 2FA
                        </div>
                        <h3 class="mt-3 fw-semibold">Masukkan kode 2FA</h3>
                        <p class="text-muted mb-0">Gunakan aplikasi authenticator untuk mendapatkan kode 6 digit.</p>
                    </div>
                    @if($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif
                    <form method="POST" action="{{ route('twofactor.verify') }}" class="row gy-3">
                        @csrf
                        <div class="col-12">
                            <label for="twofactor-code" class="form-label text-default">Kode 6 digit</label>
                            <input type="text" name="code" class="form-control @error('code') is-invalid @enderror" id="twofactor-code" placeholder="123456" autofocus required>
                            @error('code') <span class="invalid-feedback">{{ $message }}</span> @enderror
                        </div>
                        <div class="col-12 d-grid">
                            <button type="submit" class="btn btn-primary btn-wave">Verifikasi</button>
                        </div>
                        <div class="col-12">
                            <a href="{{ route('login') }}" class="text-muted">Kembali ke login</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="col-lg-6 p-0 d-none d-lg-block">
            <div class="h-100 w-100 position-relative">
                <img src="{{ asset('auth-asset-cover.jpg') }}" alt="Asset cover" class="h-100 w-100 object-fit-cover">
                <div class="position-absolute bottom-0 start-0 end-0 p-4 bg-dark bg-opacity-50 text-fixed-white">
                    <h4 class="fw-semibold mb-1">Keamanan Berlapis</h4>
                    <p class="mb-0 text-fixed-white-7">Lindungi akses dashboard dengan verifikasi dua faktor.</p>
                </div>
            </div>
        </div>
    </div>
@endsection
