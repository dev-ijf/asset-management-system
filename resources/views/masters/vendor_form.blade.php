<div class="modal-body">
    <div class="row g-3">
        <div class="col-md-6">
            <label class="form-label">Vendor</label>
            <input type="text" name="vendor_name" class="form-control" required value="{{ $values['vendor_name'] ?? '' }}">
        </div>
        <div class="col-md-6">
            <label class="form-label">No. Kontrak</label>
            <input type="text" name="contract_number" class="form-control" value="{{ $values['contract_number'] ?? '' }}">
        </div>
        <div class="col-md-6">
            <label class="form-label">Tanggal Mulai</label>
            <input type="date" name="start_date" class="form-control" value="{{ $values['start_date'] ?? '' }}">
        </div>
        <div class="col-md-6">
            <label class="form-label">Tanggal Akhir</label>
            <input type="date" name="end_date" class="form-control" value="{{ $values['end_date'] ?? '' }}">
        </div>
        <div class="col-md-6">
            <label class="form-label">SLA Response (jam)</label>
            <input type="number" name="sla_response_hours" class="form-control" value="{{ $values['sla_response_hours'] ?? '' }}">
        </div>
        <div class="col-md-6">
            <label class="form-label">SLA Resolution (jam)</label>
            <input type="number" name="sla_resolution_hours" class="form-control" value="{{ $values['sla_resolution_hours'] ?? '' }}">
        </div>
        <div class="col-md-12">
            <label class="form-label">Catatan</label>
            <textarea name="notes" class="form-control" rows="2">{{ $values['notes'] ?? '' }}</textarea>
        </div>
    </div>
</div>
<div class="modal-footer">
    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
    <button type="submit" class="btn btn-primary">Simpan</button>
</div>
