<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetMaintenance;
use App\Services\Asset\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetMaintenanceController extends Controller
{
    public function __construct(private readonly AssetService $assets)
    {
    }

    public function index(): View
    {
        $maintenances = AssetMaintenance::with('asset')->latest()->paginate(config('system.ui.table_page_size', 20));
        $assets = Asset::orderBy('code')->get();

        return view('assets.maintenances', compact('maintenances', 'assets'));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'asset_id' => ['required', 'uuid', 'exists:assets,id'],
            'performed_at' => ['nullable', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $asset = Asset::findOrFail($data['asset_id']);
        $this->assets->maintenance($asset, $data);

        return back()->with('success', 'Data perawatan berhasil dicatat.');
    }

    public function update(Request $request, AssetMaintenance $asset_maintenance): RedirectResponse
    {
        $data = $request->validate([
            'asset_id' => ['required', 'uuid', 'exists:assets,id'],
            'performed_at' => ['nullable', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $asset_maintenance->update($data);

        return back()->with('success', 'Data perawatan berhasil diperbarui.');
    }

    public function destroy(AssetMaintenance $asset_maintenance): RedirectResponse
    {
        $asset_maintenance->delete();

        return back()->with('success', 'Data perawatan dihapus.');
    }
}
