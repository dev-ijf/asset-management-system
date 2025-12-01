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
        <label class="form-label">Aset</label>
        <select name="asset_id" class="form-select">
            <option value="">Semua</option>
            @foreach($assets as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_id'] ?? '') == $item->id)>{{ $item->code }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Lokasi Tujuan</label>
        <select name="asset_location_id" class="form-select">
            <option value="">Semua</option>
            @foreach($locations as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_location_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">Dept Tujuan</label>
        <select name="department_id" class="form-select">
            <option value="">Semua</option>
            @foreach($departments as $item)
                <option value="{{ $item->id }}" @selected(($filters['department_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-3">
        <label class="form-label">User Tujuan</label>
        <select name="asset_user_id" class="form-select">
            <option value="">Semua</option>
            @foreach($users as $item)
                <option value="{{ $item->id }}" @selected(($filters['asset_user_id'] ?? '') == $item->id)>{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-12 d-flex gap-2 mt-2">
        <button type="submit" class="btn btn-primary btn-wave">Terapkan</button>
        <a href="{{ route('reports.movements') }}" class="btn btn-outline-secondary">Reset</a>
    </div>
</form>
