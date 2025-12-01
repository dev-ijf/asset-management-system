<?php

namespace App\Http\Controllers;

use App\Http\Requests\PermissionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use App\Models\Permission;

class PermissionController extends Controller
{
    public function index(): View
    {
        $permissions = Permission::orderBy('name')->get();

        return view('rbac.permissions.index', compact('permissions'));
    }

    public function store(PermissionRequest $request): RedirectResponse
    {
        Permission::create([
            'name' => $request->input('name'),
            'guard_name' => 'web',
        ]);

        return back()->with('success', 'Permission berhasil ditambahkan.');
    }

    public function update(PermissionRequest $request, Permission $permission): RedirectResponse
    {
        $permission->update(['name' => $request->input('name')]);

        return back()->with('success', 'Permission berhasil diperbarui.');
    }
}
