@extends('layouts.custom-master')

@php
$bodyClass = 'bg-white';
@endphp

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-7">
            <div class="card custom-card shadow-sm">
                <div class="card-body">
                    <h3 class="fw-semibold mb-2">Konfigurasi Database Diperlukan</h3>
                    <p class="text-muted">Kami tidak dapat terhubung ke database. Pastikan langkah berikut:</p>
                    <ol class="text-muted mb-3">
                        <li>Buat database (mis. <code>asset_management_system</code>).</li>
                        <li>Isi kredensial di file <code>.env</code> (DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD).</li>
                        <li>Klik salah satu tombol di bawah untuk menjalankan migrasi (dengan/atau tanpa sample data).</li>
                        <li>Setelah migrasi, lanjutkan wizard di <a href="{{ route('setup.index') }}">/setup</a>.</li>
                    </ol>
                    @if($errors->any())
                        <div class="alert alert-danger">
                            @foreach($errors->all() as $error)
                                <div>{{ $error }}</div>
                            @endforeach
                        </div>
                    @endif
                    <div class="d-flex flex-wrap gap-2">
                        <form method="POST" action="{{ route('setup.migrate') }}">
                            @csrf
                            <button type="submit" class="btn btn-primary">Migrate &amp; Seed Minimal (RBAC)</button>
                        </form>
                        <form method="POST" action="{{ route('setup.migrate') }}">
                            @csrf
                            <input type="hidden" name="with_sample" value="1">
                            <button type="submit" class="btn btn-success">Migrate + Sample Data (Full Seed)</button>
                        </form>
                        <a href="{{ url()->previous() }}" class="btn btn-outline-secondary ms-auto">Kembali</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
