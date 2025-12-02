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
                        <li>Jalankan migrasi dan seeder: <code>php artisan migrate --seed</code>.</li>
                        <li>Setelah itu, jalankan wizard di <a href="{{ route('setup.index') }}">/setup</a> bila diperlukan.</li>
                    </ol>
                    @if($errors->any())
                        <div class="alert alert-danger">
                            @foreach($errors->all() as $error)
                                <div>{{ $error }}</div>
                            @endforeach
                        </div>
                    @endif
                    <div class="d-flex justify-content-between">
                        <a href="{{ url()->previous() }}" class="btn btn-outline-secondary">Kembali</a>
                        <a href="{{ route('setup.index') }}" class="btn btn-primary">Buka Setup</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
