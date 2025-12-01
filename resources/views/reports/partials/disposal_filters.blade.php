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
        <label class="form-label">Status</label>
        <select name="status" class="form-select">
            <option value="">Semua</option>
            <option value="active" @selected(($filters['status'] ?? '') === 'active')>Active</option>
            <option value="reversed" @selected(($filters['status'] ?? '') === 'reversed')>Reversed</option>
        </select>
    </div>
    <div class="col-md-12 d-flex gap-2 mt-2">
        <button type="submit" class="btn btn-primary btn-wave">Terapkan</button>
        <a href="{{ route('reports.disposals') }}" class="btn btn-outline-secondary">Reset</a>
    </div>
</form>
