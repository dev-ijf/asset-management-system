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
                        @php
                            $booleanOptions = [1 => 'Aktif', 0 => 'Nonaktif'];
                            $timezoneOptions = [
                                'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura',
                                'Asia/Singapore', 'Asia/Kuala_Lumpur', 'UTC'
                            ];
                            $currencyOptions = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];
                            $dateFormats = ['d/m/Y', 'Y-m-d', 'm/d/Y'];
                            $timeFormats = ['H:i', 'h:i A'];
                            $pageSizes = [10, 25, 50, 100];
                            $depreciationOptions = [
                                'straight_line' => 'Straight Line',
                                'diminishing_balance' => 'Diminishing Balance',
                            ];
                        @endphp
                        <form method="POST" action="{{ route('setup.store') }}">
                            @csrf
                            <input type="hidden" name="step" value="2">
                            <p class="text-muted">Sesuaikan konfigurasi awal. Nilai diambil dari seeder dan dapat diubah.</p>
                            @foreach($settings->groupBy('group') as $group => $items)
                                <div class="border rounded p-3 mb-3">
                                    <h6 class="fw-semibold text-uppercase text-muted mb-2">{{ ucfirst($group) }}</h6>
                                    <div class="row g-3">
                                        @foreach($items as $setting)
                                            @php
                                                $label = ucwords(str_replace(['.', '_'], ' ', $setting->key));
                                                $fieldName = "settings[{$setting->key}]";
                                                $current = old('settings.'.$setting->key, $setting->value);
                                            @endphp
                                            <div class="col-md-6">
                                                <label class="form-label">{{ $label }}</label>
                                                @switch($setting->key)
                                                    @case('application.timezone')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($timezoneOptions as $tz)
                                                                <option value="{{ $tz }}" @selected($current == $tz)>{{ $tz }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @case('ui.currency')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($currencyOptions as $cur)
                                                                <option value="{{ $cur }}" @selected($current == $cur)>{{ $cur }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @case('ui.date_format')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($dateFormats as $fmt)
                                                                <option value="{{ $fmt }}" @selected($current == $fmt)>{{ $fmt }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @case('ui.time_format')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($timeFormats as $fmt)
                                                                <option value="{{ $fmt }}" @selected($current == $fmt)>{{ $fmt }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @case('ui.table_page_size')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($pageSizes as $size)
                                                                <option value="{{ $size }}" @selected($current == $size)>{{ $size }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @case('asset.depreciation_method')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($depreciationOptions as $val => $text)
                                                                <option value="{{ $val }}" @selected($current == $val)>{{ $text }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @case('asset.qr_enabled')
                                                    @case('security.audit_log')
                                                    @case('notification.email_enabled')
                                                    @case('maintenance.readonly_mode')
                                                        <select name="{{ $fieldName }}" class="form-select">
                                                            @foreach($booleanOptions as $val => $text)
                                                                <option value="{{ $val }}" @selected((int)$current === (int)$val)>{{ $text }}</option>
                                                            @endforeach
                                                        </select>
                                                        @break
                                                    @default
                                                        <input
                                                            type="{{ $setting->type === 'integer' ? 'number' : 'text' }}"
                                                            name="{{ $fieldName }}"
                                                            class="form-control"
                                                            value="{{ $current }}"
                                                            placeholder="@lang('Contoh:') {{
                                                                match($setting->key) {
                                                                    'application.name' => 'Asset Management System',
                                                                    'asset.code_prefix' => 'AST',
                                                                    'asset.warranty_reminder_days' => '30',
                                                                    'asset.attachment_max_size_mb' => '20',
                                                                    'notification.slack_webhook_url' => 'https://hooks.slack.com/services/XXXX/XXXX/XXXX',
                                                                    'maintenance.window' => 'Sabtu 23:00-02:00',
                                                                    'integration.api_key' => 'ubah-ke-api-key-anda',
                                                                    'integration.webhook_url' => 'https://erp.example.com/webhook/asset',
                                                                    'integration.webhook_secret' => 'secret-optional',
                                                                    default => ''
                                                                }
                                                            }}"
                                                        >
                                                @endswitch
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
