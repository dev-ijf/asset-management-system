<div class="row g-3">
    <div class="col-md-6">
        <label class="form-label">Nama</label>
        <input type="text" name="name" class="form-control" placeholder="Nama lengkap" required>
    </div>
    <div class="col-md-6">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" placeholder="email@example.com" required>
    </div>
    <div class="col-md-6">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-control" autocomplete="new-password" {{ request()->routeIs('users.store') ? 'required' : '' }}>
    </div>
    <div class="col-md-6">
        <label class="form-label">Konfirmasi Password</label>
        <input type="password" name="password_confirmation" class="form-control" autocomplete="new-password" {{ request()->routeIs('users.store') ? 'required' : '' }}>
    </div>
</div>

<div class="mt-3">
    <label class="form-label">Roles</label>
    <div class="row">
        @forelse($roles as $role)
            <div class="col-md-4 mb-2">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="roles[]" value="{{ $role->uuid }}"
                        id="role-{{ $role->uuid }}">
                    <label class="form-check-label" for="role-{{ $role->uuid }}">{{ $role->name }}</label>
                </div>
            </div>
        @empty
            <div class="col-12 text-muted">Belum ada role, buat dulu di menu Roles.</div>
        @endforelse
    </div>
</div>
