<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use App\Models\Permission;
use App\Models\Role;

class RoleController extends Controller
{
    public function index(): View
    {
        $roles = Role::with('permissions')->orderBy('name')->get();
        $permissions = Permission::orderBy('name')->get();

        return view('rbac.roles.index', compact('roles', 'permissions'));
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        $role = Role::create([
            'name' => $request->input('name'),
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        $role->update(['name' => $request->input('name')]);
        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', 'Role berhasil diperbarui.');
    }
}
