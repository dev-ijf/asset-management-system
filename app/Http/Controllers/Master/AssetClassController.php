<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AssetClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetClassController extends Controller
{
    public function index(): View
    {
        return view('masters.simple', [
            'title' => 'Kelas Aset',
            'routeName' => 'asset-classes',
            'items' => AssetClass::orderBy('name')->get(),
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
            'code' => ['required', 'string', 'max:50', 'unique:asset_classes,code'],
            'description' => ['nullable', 'string'],
        ]);

        AssetClass::create($data);

        return back()->with('success', 'Kelas aset berhasil ditambahkan.');
    }

    public function update(Request $request, AssetClass $asset_class): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:asset_classes,code,'.$asset_class->id],
            'description' => ['nullable', 'string'],
        ]);

        $asset_class->update($data);

        return back()->with('success', 'Kelas aset berhasil diperbarui.');
    }

    public function destroy(AssetClass $asset_class): RedirectResponse
    {
        $asset_class->delete();

        return back()->with('success', 'Kelas aset berhasil dihapus.');
    }
}
