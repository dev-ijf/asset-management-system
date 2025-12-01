<form method="GET" class="row g-2">
    <div class="col-md-3">
        <label class="form-label">Dari</label>
        <input type="date" name="date_from" class="form-control" value="{{ $filters['date_from'] ?? '' }}">
    </div>
    <div class="col-md-3">
        <label class="form-label">Sampai</label>
        <input type="date" name="date_to" class="form-control" value="{{ $filters['date_to'] ?? '' }}">
    </div>
    <div class="col-md-3">
        <label class="form-label">Status</label>
        <select name="asset_status_id" class="form-select">
            <option value="">Semua</option>
            @foreach($statuses as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_status_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Kelas</label>
        <select name="asset_class_id" class="form-select">
            <option value="">Semua</option>
            @foreach($classes as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_class_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Kategori</label>
        <select name="asset_category_id" class="form-select">
            <option value="">Semua</option>
            @foreach($categories as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_category_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Lokasi</label>
        <select name="asset_location_id" class="form-select">
            <option value="">Semua</option>
            @foreach($locations as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_location_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Departemen</label>
        <select name="department_id" class="form-select">
            <option value="">Semua</option>
            @foreach($departments as $item)
                <option value="{{ $item->id }}" @selected(($filters['department_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Pengguna</label>
        <select name="asset_user_id" class="form-select">
            <option value="">Semua</option>
            @foreach($users as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_user_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Person in Charge</label>
        <select name="person_in_charge_id" class="form-select">
            <option value="">Semua</option>
            @foreach($pics as $item)
                <option value="{{ $item->id }}" @selected(($filters['person_in_charge_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Garansi</label>
        <select name="warranty_id" class="form-select">
            <option value="">Semua</option>
            @foreach($warranties as $item)
                <option value="{{ $item->id }}" @selected(($filters['warranty_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-12 d-flex gap-2 mt-2">
        <button type="submit" class="btn btn-primary btn-wave">Terapkan</button>
        <a href="{{ route('reports.assets') }}" class="btn btn-outline-secondary">Reset</a>
    </div>
</form>
