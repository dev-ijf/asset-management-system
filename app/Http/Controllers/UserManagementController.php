<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use App\Models\Role;

class UserManagementController extends Controller
{
    public function index(): View
    {
        $users = User::with('roles')->orderBy('name')->get();
        $roles = Role::orderBy('name')->get();

        return view('rbac.users.index', compact('users', 'roles'));
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $user = User::create($request->validated());

        $user->syncRoles($request->input('roles', []));

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);
        $user->syncRoles($request->input('roles', []));

        return back()->with('success', 'User berhasil diperbarui.');
    }
}
