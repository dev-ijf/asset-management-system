<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AssetLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetLocationController extends Controller
{
    public function index(): View
    {
        $options = AssetLocation::orderBy('name')->get()->pluck('name', 'id')->toArray();

        return view('masters.simple', [
            'title' => 'Lokasi Aset',
            'routeName' => 'asset-locations',
            'items' => AssetLocation::orderBy('name')->get(),
            'fields' => [
                ['name' => 'name', 'label' => 'Nama', 'required' => true],
                ['name' => 'code', 'label' => 'Kode', 'required' => true],
                ['name' => 'parent_id', 'label' => 'Parent', 'type' => 'select', 'options' => $options],
                ['name' => 'description', 'label' => 'Deskripsi', 'type' => 'textarea'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:asset_locations,code'],
            'parent_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'description' => ['nullable', 'string'],
        ]);

        AssetLocation::create($data);

        return back()->with('success', 'Lokasi aset berhasil ditambahkan.');
    }

    public function update(Request $request, AssetLocation $asset_location): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:asset_locations,code,'.$asset_location->id],
            'parent_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'description' => ['nullable', 'string'],
        ]);

        $asset_location->update($data);

        return back()->with('success', 'Lokasi aset berhasil diperbarui.');
    }

    public function destroy(AssetLocation $asset_location): RedirectResponse
    {
        $asset_location->delete();

        return back()->with('success', 'Lokasi aset berhasil dihapus.');
    }
}
