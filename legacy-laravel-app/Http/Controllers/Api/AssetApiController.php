<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetApiController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min($request->integer('per_page', 25), 100);

        $assets = Asset::query()
            ->with(['status', 'class', 'category', 'assetLocation', 'department', 'personInCharge'])
            ->when($request->filled('status'), fn ($q) => $q->whereHas('status', fn ($qq) => $qq->where('code', $request->string('status'))))
            ->when($request->filled('location_id'), fn ($q) => $q->where('asset_location_id', $request->string('location_id')))
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->string('department_id')))
            ->when($request->filled('search'), fn ($q) => $q->where(function ($qq) use ($request) {
                $s = $request->string('search');
                $qq->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%");
            }))
            ->paginate($perPage);

        return response()->json($assets);
    }

    public function show(Asset $asset)
    {
        return response()->json(
            $asset->load([
                'status', 'class', 'category', 'assetLocation', 'department',
                'personInCharge', 'assetUser', 'warranty', 'photos',
            ])
        );
    }
}
