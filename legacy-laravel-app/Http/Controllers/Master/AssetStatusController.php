<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AssetStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetStatusController extends Controller
{
    public function index(): View
    {
        return view('masters.simple', [
            'title' => 'Status Aset',
            'routeName' => 'asset-statuses',
            'items' => AssetStatus::orderBy('name')->get(),
            'fields' => [
                ['name' => 'name', 'label' => 'Nama', 'required' => true],
                ['name' => 'code', 'label' => 'Kode', 'required' => true],
                ['name' => 'description', 'label' => 'Deskripsi', 'type' => 'textarea'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:asset_statuses,code'],
            'description' => ['nullable', 'string'],
        ]);

        AssetStatus::create($data);

        return back()->with('success', 'Status aset berhasil ditambahkan.');
    }

    public function update(Request $request, AssetStatus $asset_status): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:asset_statuses,code,'.$asset_status->id],
            'description' => ['nullable', 'string'],
        ]);

        $asset_status->update($data);

        return back()->with('success', 'Status aset berhasil diperbarui.');
    }

    public function destroy(AssetStatus $asset_status): RedirectResponse
    {
        $asset_status->delete();

        return back()->with('success', 'Status aset berhasil dihapus.');
    }
}
