<div class="mb-3">
    <label class="form-label">Nama Role</label>
    <input type="text" name="name" class="form-control" placeholder="mis: admin" required>
</div>
<div class="mb-3">
    <label class="form-label">Permissions</label>
    <div class="row">
        @foreach($permissions as $permission)
            <div class="col-md-4 mb-2">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="permissions[]" value="{{ $permission->uuid }}"
                        id="perm-{{ $permission->uuid }}">
                    <label class="form-check-label" for="perm-{{ $permission->uuid }}">{{ $permission->name }}</label>
                </div>
            </div>
        @endforeach
    </div>
</div>
