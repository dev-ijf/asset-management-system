@extends('layouts.master')

@php
    $routeParamName = \Illuminate\Support\Str::singular(str_replace('-', '_', $routeName));
@endphp

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3 page-header-breadcrumb flex-wrap gap-2">
        <div>
            <h1 class="page-title fw-medium fs-20 mb-0">{{ $title }}</h1>
            @if(!empty($subtitle))
                <p class="text-muted mb-0">{{ $subtitle }}</p>
            @endif
        </div>
        <button class="btn btn-primary btn-wave" data-bs-toggle="modal" data-bs-target="#createModal">
            <i class="ri-add-line me-1"></i>Tambah
        </button>
    </div>

    <div class="card custom-card">
        <div class="card-header">
            <div class="card-title mb-0">{{ $title }}</div>
        </div>
        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success alert-dismissible" role="alert">
                    {{ session('success') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
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

            <div class="table-responsive">
                <table class="table table-bordered align-middle text-nowrap mb-0">
                    <thead class="table-light">
                        <tr>
                            @foreach($fields as $field)
                                <th>{{ $field['label'] }}</th>
                            @endforeach
                            <th class="text-center" style="width: 10%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($items as $item)
                            <tr>
                                @foreach($fields as $field)
                                    @php
                                        $value = data_get($item, $field['name']);
                                        if (($field['type'] ?? '') === 'select' && isset($field['options'][$value])) {
                                            $value = $field['options'][$value];
                                        }
                                    @endphp
                                    <td>{{ $value ?: '-' }}</td>
                                @endforeach
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#editModal"
                                        data-id="{{ $item->getKey() }}"
                                        data-payload='@json($item->only(array_column($fields, "name")))'>
                                        Edit
                                    </button>
                                    <form action="{{ route($routeName.'.destroy', $item) }}" method="POST" class="d-inline"
                                        onsubmit="return confirm('Hapus data ini?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-sm btn-outline-danger">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ count($fields)+1 }}" class="text-center text-muted">Belum ada data.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- Modal create --}}
    <div class="modal fade" id="createModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Tambah {{ $title }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form action="{{ route($routeName.'.store') }}" method="POST">
                    @csrf
                    <div class="modal-body">
                        @include('masters.simple_form', ['fields' => $fields, 'values' => []])
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Modal edit --}}
    <div class="modal fade" id="editModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit {{ $title }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="editForm" method="POST">
                    @csrf
                    @method('PUT')
                    <div class="modal-body">
                        @include('masters.simple_form', ['fields' => $fields, 'values' => []])
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
<script>
    const editModal = document.getElementById('editModal');
    if (editModal) {
        const updateRouteTemplate = "{{ route($routeName.'.update', [$routeParamName => '__ID__']) }}";
        editModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const form = document.getElementById('editForm');
            const payload = JSON.parse(button.getAttribute('data-payload') || '{}');

            form.action = updateRouteTemplate.replace('__ID__', button.getAttribute('data-id'));

            @foreach($fields as $field)
                (function() {
                    const name = "{{ $field['name'] }}";
                    const el = form.querySelector(`[name="${name}"]`);
                    if (!el) return;
                    if (el.tagName === 'SELECT') {
                        el.value = payload[name] ?? '';
                    } else if (el.type === 'checkbox') {
                        el.checked = !!payload[name];
                    } else {
                        el.value = payload[name] ?? '';
                    }
                })();
            @endforeach
        });
    }
</script>
@endsection
