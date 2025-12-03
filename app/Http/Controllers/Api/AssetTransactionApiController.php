<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Services\Asset\AssetService;
use Illuminate\Http\Request;

class AssetTransactionApiController extends Controller
{
    public function __construct(private readonly AssetService $assets)
    {
    }

    public function storeMovement(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'to_location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'to_department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'to_asset_user_id' => ['nullable', 'uuid', 'exists:asset_users,id'],
            'notes' => ['nullable', 'string'],
            'performed_at' => ['nullable', 'date'],
        ]);

        $movement = $this->assets->move($asset, $data);

        return response()->json(['message' => 'Movement recorded', 'data' => $movement], 201);
    }

    public function storeDisposal(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'disposed_at' => ['nullable', 'date'],
        ]);

        $disposal = $this->assets->dispose($asset, $data);

        return response()->json(['message' => 'Disposal recorded', 'data' => $disposal], 201);
    }

    public function storeAudit(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:matched,missing,damaged'],
            'notes' => ['nullable', 'string'],
            'location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'audited_at' => ['nullable', 'date'],
        ]);

        $audit = $this->assets->audit($asset, $data);

        return response()->json(['message' => 'Audit recorded', 'data' => $audit], 201);
    }
}
