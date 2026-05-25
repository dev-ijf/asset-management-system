<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AssetCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetCategoryController extends Controller
{
    public function index(): View
    {
        $options = AssetCategory::orderBy('name')->get()->pluck('name', 'id')->toArray();

        return view('masters.simple', [
            'title' => 'Kategori Aset',
            'routeName' => 'asset-categories',
            'items' => AssetCategory::orderBy('name')->get(),
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
            'code' => ['required', 'string', 'max:50', 'unique:asset_categories,code'],
            'parent_id' => ['nullable', 'uuid', 'exists:asset_categories,id'],
            'description' => ['nullable', 'string'],
        ]);

        AssetCategory::create($data);

        return back()->with('success', 'Kategori aset berhasil ditambahkan.');
    }

    public function update(Request $request, AssetCategory $asset_category): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:asset_categories,code,'.$asset_category->id],
            'parent_id' => ['nullable', 'uuid', 'exists:asset_categories,id'],
            'description' => ['nullable', 'string'],
        ]);

        $asset_category->update($data);

        return back()->with('success', 'Kategori aset berhasil diperbarui.');
    }

    public function destroy(AssetCategory $asset_category): RedirectResponse
    {
        $asset_category->delete();

        return back()->with('success', 'Kategori aset berhasil dihapus.');
    }
}
