                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Aset</label>
                                <select name="asset_id" class="form-select" required>
                                    <option value="">-- Pilih --</option>
                                    @foreach($assets as $asset)
                                        <option value="{{ $asset->id }}">{{ $asset->code }} - {{ $asset->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Tanggal Perawatan</label>
                                <input type="date" name="performed_at" class="form-control">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Deskripsi</label>
                                <input type="text" name="description" class="form-control" required placeholder="Contoh: Ganti oli">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Vendor</label>
                                <input type="text" name="vendor" class="form-control" placeholder="Nama vendor/teknisi">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Biaya</label>
                                <input type="number" step="0.01" name="cost" class="form-control" placeholder="0.00">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option value="planned">Planned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed" selected>Completed</option>
                                </select>
                            </div>
                            <div class="col-md-12">
                                <label class="form-label">Catatan</label>
                                <textarea name="notes" class="form-control" rows="2" placeholder="Catatan tambahan"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
