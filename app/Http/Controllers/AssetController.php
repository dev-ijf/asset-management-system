<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetClass;
use App\Models\AssetLocation;
use App\Models\AssetStatus;
use App\Models\AssetUser;
use App\Models\Department;
use App\Models\PersonInCharge;
use App\Models\Unit;
use App\Models\Warranty;
use App\Services\Asset\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AssetController extends Controller
{
    public function __construct(private readonly AssetService $assets)
    {
    }

    public function index(): View
    {
        $assets = Asset::with(['status', 'class', 'category', 'unit', 'department', 'personInCharge', 'user', 'location', 'warranty'])
            ->orderBy('created_at', 'desc')
            ->get();

        return view('assets.index', [
            'assets' => $assets,
            'statuses' => AssetStatus::orderBy('name')->get(),
            'classes' => AssetClass::orderBy('name')->get(),
            'categories' => AssetCategory::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'peopleInCharge' => PersonInCharge::orderBy('name')->get(),
            'users' => AssetUser::orderBy('name')->get(),
            'locations' => AssetLocation::orderBy('name')->get(),
            'warranties' => Warranty::orderBy('duration_months')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRequest($request);
        $asset = $this->assets->create($data);

        return back()->with('success', "Aset {$asset->code} berhasil ditambahkan.");
    }

    public function update(Request $request, Asset $asset): RedirectResponse
    {
        $data = $this->validateRequest($request, $asset->id);
        $this->assets->update($asset, $data);

        return back()->with('success', "Aset {$asset->code} berhasil diperbarui.");
    }

    public function history(Asset $asset): View
    {
        $asset->load('histories');

        return view('assets.history', compact('asset'));
    }

    private function validateRequest(Request $request, ?string $assetId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'asset_status_id' => ['nullable', 'uuid', 'exists:asset_statuses,id'],
            'asset_class_id' => ['nullable', 'uuid', 'exists:asset_classes,id'],
            'asset_category_id' => ['nullable', 'uuid', 'exists:asset_categories,id'],
            'unit_id' => ['nullable', 'uuid', 'exists:units,id'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'person_in_charge_id' => ['nullable', 'uuid', 'exists:people_in_charge,id'],
            'asset_user_id' => ['nullable', 'uuid', 'exists:asset_users,id'],
            'asset_location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'warranty_id' => ['nullable', 'uuid', 'exists:warranties,id'],
            'purchase_date' => ['nullable', 'date'],
            'warranty_end' => ['nullable', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);
    }
}
