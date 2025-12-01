<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Services\Asset\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AssetTransactionController extends Controller
{
    public function __construct(private readonly AssetService $assets)
    {
    }

    public function storeMovement(Request $request, Asset $asset): RedirectResponse
    {
        $data = $request->validate([
            'to_location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'to_department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'notes' => ['nullable', 'string'],
            'performed_at' => ['nullable', 'date'],
        ]);

        $this->assets->move($asset, $data);

        return back()->with('success', 'Movement aset berhasil dicatat.');
    }

    public function storeDisposal(Request $request, Asset $asset): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'disposed_at' => ['nullable', 'date'],
        ]);

        $this->assets->dispose($asset, $data);

        return back()->with('success', 'Disposal aset berhasil dicatat.');
    }

    public function reverseDisposal(Request $request, AssetDisposal $disposal): RedirectResponse
    {
        $data = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $this->assets->reverseDisposal($disposal, $data['notes'] ?? null);

        return back()->with('success', 'Reverse disposal berhasil.');
    }
}
