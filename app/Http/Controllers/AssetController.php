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

    public function index(Request $request): View
    {
        $filters = $request->only([
            'q',
            'asset_status_id',
            'asset_class_id',
            'asset_category_id',
            'asset_location_id',
            'department_id',
            'asset_user_id',
            'person_in_charge_id',
            'warranty_id',
        ]);

        $assets = Asset::with(['status', 'class', 'category', 'unit', 'department', 'personInCharge', 'user', 'location', 'warranty'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qBuilder) use ($q) {
                    $qBuilder->where('code', 'like', "%{$q}%")
                        ->orWhere('name', 'like', "%{$q}%")
                        ->orWhere('serial_number', 'like', "%{$q}%");
                });
            })
            ->when($filters['asset_status_id'] ?? null, fn($q, $v) => $q->where('asset_status_id', $v))
            ->when($filters['asset_class_id'] ?? null, fn($q, $v) => $q->where('asset_class_id', $v))
            ->when($filters['asset_category_id'] ?? null, fn($q, $v) => $q->where('asset_category_id', $v))
            ->when($filters['asset_location_id'] ?? null, fn($q, $v) => $q->where('asset_location_id', $v))
            ->when($filters['department_id'] ?? null, fn($q, $v) => $q->where('department_id', $v))
            ->when($filters['asset_user_id'] ?? null, fn($q, $v) => $q->where('asset_user_id', $v))
            ->when($filters['person_in_charge_id'] ?? null, fn($q, $v) => $q->where('person_in_charge_id', $v))
            ->when($filters['warranty_id'] ?? null, fn($q, $v) => $q->where('warranty_id', $v))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

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
            'filters' => $filters,
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

    public function show(Asset $asset): View
    {
        $asset->load([
            'status','class','category','unit','department',
            'personInCharge','user','location','warranty',
            'movements.fromLocation','movements.toLocation','movements.fromDepartment','movements.toDepartment',
            'disposals',
        ]);

        return view('assets.show', compact('asset'));
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
