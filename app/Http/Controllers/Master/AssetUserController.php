<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AssetUser;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetUserController extends Controller
{
    public function index(): View
    {
        $departments = Department::orderBy('name')->get()->pluck('name', 'id')->toArray();

        return view('masters.simple', [
            'title' => 'Pengguna Aset',
            'routeName' => 'asset-users',
            'items' => AssetUser::with('department')->orderBy('name')->get(),
            'fields' => [
                ['name' => 'name', 'label' => 'Nama', 'required' => true],
                ['name' => 'email', 'label' => 'Email'],
                ['name' => 'phone', 'label' => 'Telepon'],
                ['name' => 'department_id', 'label' => 'Departemen', 'type' => 'select', 'options' => $departments],
                ['name' => 'notes', 'label' => 'Catatan', 'type' => 'textarea'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'notes' => ['nullable', 'string'],
        ]);

        AssetUser::create($data);

        return back()->with('success', 'Pengguna aset berhasil ditambahkan.');
    }

    public function update(Request $request, AssetUser $asset_user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $asset_user->update($data);

        return back()->with('success', 'Pengguna aset berhasil diperbarui.');
    }

    public function destroy(AssetUser $asset_user): RedirectResponse
    {
        $asset_user->delete();

        return back()->with('success', 'Pengguna aset berhasil dihapus.');
    }
}
