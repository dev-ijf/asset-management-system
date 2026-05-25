<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use App\Models\Role;
use App\Services\Logging\ActivityLogger;

class UserManagementController extends Controller
{
    public function __construct(private readonly ActivityLogger $logger)
    {
    }

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

        $this->logger->audit([
            'action' => 'user_created',
            'model' => 'User',
            'model_id' => $user->id,
            'changes' => ['name' => $user->name, 'email' => $user->email, 'roles' => $request->input('roles', [])],
        ]);

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

        $this->logger->audit([
            'action' => 'user_updated',
            'model' => 'User',
            'model_id' => $user->id,
            'changes' => ['name' => $user->name, 'email' => $user->email, 'roles' => $request->input('roles', [])],
        ]);

        return back()->with('success', 'User berhasil diperbarui.');
    }
}
