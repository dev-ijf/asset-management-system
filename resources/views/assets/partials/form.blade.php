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

    <div class="col-12">
        <hr>
        <h6 class="fw-semibold mb-2">Identifikasi & Label</h6>
    </div>
    <div class="col-md-4">
        <label class="form-label">RFID Tag</label>
        <input type="text" name="rfid_tag" class="form-control" placeholder="mis: RFID-00001">
    </div>
    <div class="col-md-4">
        <label class="form-label">NFC Tag</label>
        <input type="text" name="nfc_tag" class="form-control" placeholder="mis: NFC-00001">
    </div>
    <div class="col-md-4">
        <label class="form-label">Template Label</label>
        <select name="label_template" class="form-select">
            <option value="">-- Pilih --</option>
            <option value="default">Default</option>
            <option value="small">Small</option>
            <option value="large">Large</option>
        </select>
    </div>

    <div class="col-12">
        <hr>
        <h6 class="fw-semibold mb-2">Stok & Pool</h6>
    </div>
    <div class="col-md-4">
        <label class="form-label">Jenis</label>
        <select name="is_consumable" class="form-select">
            <option value="0">Non-consumable</option>
            <option value="1">Consumable / Habis Pakai</option>
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">Quantity</label>
        <input type="number" min="1" name="quantity" class="form-control" value="1">
    </div>
    <div class="col-md-4">
        <label class="form-label">Tersedia</label>
        <input type="number" min="0" name="available_quantity" class="form-control" value="1">
    </div>
    <div class="col-md-4">
        <label class="form-label">Pool / Pinjaman</label>
        <select name="is_pool" class="form-select">
            <option value="0">Tidak</option>
            <option value="1">Ya, aset pool</option>
        </select>
    </div>
</div>
