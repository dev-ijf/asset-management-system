<div class="row g-3">
    <div class="col-md-6">
        <label class="form-label">Key</label>
        <input type="text" name="key" class="form-control" placeholder="mis: asset.code_prefix" required>
        <small class="text-muted">Gunakan format dot notation untuk pengelompokan.</small>
    </div>
    <div class="col-md-3">
        <label class="form-label">Group</label>
        <input type="text" name="group" class="form-control" placeholder="asset/ui/security">
    </div>
    <div class="col-md-3">
        <label class="form-label">Tipe</label>
        <select name="type" class="form-select" required>
            <option value="string">String</option>
            <option value="integer">Integer</option>
            <option value="float">Float</option>
            <option value="boolean">Boolean</option>
            <option value="array">Array (JSON)</option>
        </select>
    </div>

    <div class="col-md-12">
        <label class="form-label">Nilai</label>
        <textarea name="value" class="form-control" rows="3" placeholder="Isi sesuai tipe, array gunakan JSON"></textarea>
    </div>

    <div class="col-md-9">
        <label class="form-label">Deskripsi</label>
        <input type="text" name="description" class="form-control" placeholder="Catatan untuk pengguna">
    </div>

    <div class="col-md-3 d-flex align-items-end">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="is_public" value="1" id="isPublicCheck">
            <label class="form-check-label" for="isPublicCheck">
                Dapat dilihat publik
            </label>
        </div>
    </div>
</div>
