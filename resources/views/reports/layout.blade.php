@extends('layouts.master')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">{{ $title }}</h1>
            @if(!empty($subtitle))
                <p class="text-muted mb-0">{{ $subtitle }}</p>
            @endif
        </div>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">Filter</div>
        </div>
        <div class="card-body">
            {{ $filtersView }}
        </div>
    </div>

    <div class="card custom-card mt-3">
        <div class="card-header d-flex justify-content-between align-items-center">
            <div class="card-title mb-0">{{ $title }}</div>
            <div class="btn-list">
                <a href="{{ request()->fullUrlWithQuery(['export' => 'excel']) }}" class="btn btn-outline-primary btn-sm">Export Excel</a>
                <a href="{{ request()->fullUrlWithQuery(['export' => 'pdf']) }}" class="btn btn-outline-secondary btn-sm">Export PDF</a>
            </div>
        </div>
        <div class="card-body">
            {{ $slot }}
        </div>
    </div>
@endsection
