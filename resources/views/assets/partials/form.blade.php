<div class="row g-3">
    <div class="col-md-6">
        <label class="form-label">Nama Aset</label>
        <input type="text" name="name" class="form-control" required placeholder="mis: Laptop Dell XPS">
    </div>
    <div class="col-md-6">
        <label class="form-label">Serial Number</label>
        <input type="text" name="serial_number" class="form-control" placeholder="SN/IMEI">
    </div>

    <div class="col-md-4">
        <label class="form-label">Status</label>
        <select name="asset_status_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($statuses as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Kelas</label>
        <select name="asset_class_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($classes as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Kategori</label>
        <select name="asset_category_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($categories as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-4">
        <label class="form-label">Unit</label>
        <select name="unit_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($units as $item)
                <option value="{{ $item->id }}">{{ $item->symbol }} - {{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Departemen</label>
        <select name="department_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($departments as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Penanggung Jawab</label>
        <select name="person_in_charge_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($peopleInCharge as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-4">
        <label class="form-label">Pengguna Aset</label>
        <select name="asset_user_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($users as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Lokasi</label>
        <select name="asset_location_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($locations as $item)
                <option value="{{ $item->id }}">{{ $item->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Garansi</label>
        <select name="warranty_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($warranties as $item)
                <option value="{{ $item->id }}">{{ $item->name }} ({{ $item->duration_months }} bln)</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-4">
        <label class="form-label">Tanggal Pembelian</label>
        <input type="date" name="purchase_date" class="form-control">
    </div>
    <div class="col-md-4">
        <label class="form-label">Akhir Garansi</label>
        <input type="date" name="warranty_end" class="form-control">
    </div>
    <div class="col-md-4">
        <label class="form-label">Biaya (Rp)</label>
        <input type="number" step="0.01" name="cost" class="form-control" placeholder="0.00">
    </div>

    <div class="col-md-4">
        <label class="form-label">Metode Depresiasi</label>
        <select name="depreciation_method" class="form-select">
            <option value="">-- Pilih --</option>
            <option value="straight_line">Straight Line</option>
            <option value="diminishing">Diminishing</option>
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Umur Manfaat (bulan)</label>
        <input type="number" name="useful_life_months" class="form-control" placeholder="cth: 36">
    </div>
    <div class="col-md-4">
        <label class="form-label">Nilai Residual</label>
        <input type="number" step="0.01" name="residual_value" class="form-control" placeholder="0.00">
    </div>

    <div class="col-md-4">
        <label class="form-label">Capex / Opex</label>
        <select name="capex_opex" class="form-select">
            <option value="">-- Pilih --</option>
            <option value="capex">Capex</option>
            <option value="opex">Opex</option>
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Kontrak Vendor</label>
        <select name="vendor_contract_id" class="form-select">
            <option value="">-- Pilih --</option>
            @foreach($vendorContracts ?? [] as $contract)
                <option value="{{ $contract->id }}">{{ $contract->vendor_name }} ({{ $contract->contract_number }})</option>
            @endforeach
        </select>
    </div>

    <div class="col-md-12">
        <label class="form-label">Deskripsi</label>
        <textarea name="description" class="form-control" rows="3" placeholder="Keterangan singkat aset"></textarea>
    </div>
</div>
