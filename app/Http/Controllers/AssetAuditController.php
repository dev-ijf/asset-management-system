<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Services\Asset\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AssetAuditController extends Controller
{
    public function __construct(private readonly AssetService $assets)
    {
    }

    public function store(Request $request, Asset $asset): RedirectResponse
    {
        abort_unless($asset->isVisibleTo($request->user()), 403);
        $data = $request->validate([
            'status' => ['required', 'string', 'in:matched,missing,damaged'],
            'notes' => ['nullable', 'string'],
            'location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'audited_at' => ['nullable', 'date'],
        ]);

        $this->assets->audit($asset, $data);

        return back()->with('success', 'Audit aset berhasil dicatat.');
    }
}
