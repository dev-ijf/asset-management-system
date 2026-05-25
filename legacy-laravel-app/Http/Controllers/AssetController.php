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
use App\Models\VendorContract;
use App\Models\Warranty;
use App\Services\Asset\AssetService;
use App\Services\System\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    public function __construct(
        private readonly AssetService $assets,
        private readonly SystemSettingService $settings
    )
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
            'scope',
        ]);

        $assets = Asset::with(['status', 'class', 'category', 'unit', 'department', 'personInCharge', 'user', 'location', 'warranty'])
            ->forUser($request->user())
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
            ->when(($filters['scope'] ?? '') === 'archived', fn($q) => $q->whereNotNull('archived_at'))
            ->when(($filters['scope'] ?? '') === 'trashed', fn($q) => $q->onlyTrashed())
            ->when(($filters['scope'] ?? '') === 'all', fn($q) => $q->withTrashed())
            ->when(!in_array($filters['scope'] ?? '', ['archived','trashed','all']), fn($q) => $q->whereNull('archived_at'))
            ->orderBy('created_at', 'desc')
            ->paginate(config('system.ui.table_page_size', 15))
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
            'vendorContracts' => VendorContract::orderBy('vendor_name')->get(),
            'filters' => $filters,
            'importPreview' => session('import_preview'),
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
        abort_unless($asset->isVisibleTo($request->user()), 403);
        $data = $this->validateRequest($request, $asset->id);
        $this->assets->update($asset, $data);

        return back()->with('success', "Aset {$asset->code} berhasil diperbarui.");
    }

    public function show(Asset $asset): View
    {
        abort_unless($asset->isVisibleTo(request()->user()), 403);
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
        abort_unless($asset->isVisibleTo(request()->user()), 403);
        $asset->load('histories');

        return view('assets.history', compact('asset'));
    }

    public function archive(Asset $asset): RedirectResponse
    {
        $asset->update([
            'archived_at' => now(),
            'archived_by' => auth()->id(),
        ]);

        return back()->with('success', "Aset {$asset->code} diarsipkan.");
    }

    public function unarchive(Asset $asset): RedirectResponse
    {
        $asset->update([
            'archived_at' => null,
            'archived_by' => null,
        ]);

        return back()->with('success', "Aset {$asset->code} dikembalikan dari arsip.");
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        $asset->delete();
        return back()->with('success', "Aset {$asset->code} dihapus (soft delete).");
    }

    public function restore(string $asset): RedirectResponse
    {
        $model = Asset::onlyTrashed()->findOrFail($asset);
        $model->restore();
        return back()->with('success', "Aset {$model->code} berhasil di-restore.");
    }

    public function exportCsv(Request $request): JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filters = $request->all();
        $assets = Asset::with(['status','category','location'])
            ->when($filters['scope'] ?? null, function ($q, $scope) {
                if ($scope === 'archived') $q->whereNotNull('archived_at');
                if ($scope === 'trashed') $q->onlyTrashed();
                if ($scope === 'all') $q->withTrashed();
            })
            ->limit(2000)
            ->get();

        $filename = 'assets-export-'.now()->format('Ymd_His').'.csv';
        $tmp = tempnam(sys_get_temp_dir(), 'csv');
        $fh = fopen($tmp, 'w');
        fputcsv($fh, [
            'code','name','serial_number','status','category','location',
            'rfid_tag','nfc_tag','is_consumable','quantity','available_quantity','is_pool','archived_at'
        ]);
        foreach ($assets as $asset) {
            fputcsv($fh, [
                $asset->code,
                $asset->name,
                $asset->serial_number,
                $asset->status?->name,
                $asset->category?->name,
                $asset->location?->name,
                $asset->rfid_tag,
                $asset->nfc_tag,
                $asset->is_consumable ? '1':'0',
                $asset->quantity,
                $asset->available_quantity,
                $asset->is_pool ? '1':'0',
                $asset->archived_at,
            ]);
        }
        fclose($fh);
        return response()->download($tmp, $filename)->deleteFileAfterSend(true);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required','file','mimes:csv,txt'],
            'images_zip' => ['nullable','file','mimes:zip'],
            'action' => ['nullable','in:preview,import'],
        ]);

        $action = $request->input('action', 'preview');
        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        if (!$handle) {
            return back()->withErrors(['file' => 'File tidak bisa dibaca']);
        }

        $maxRows = (int) $this->settings->get('asset.import_max_rows', 2000);
        $allowRemoteImages = (bool) $this->settings->get('asset.import_allow_remote_images', true);
        $dedupePriority = $this->settings->get('asset.import_dedupe_priority', 'code');
        $defaultStatusName = $this->settings->get('asset.import_default_status');
        $defaultCategoryName = $this->settings->get('asset.import_default_category');
        $defaultLocationName = $this->settings->get('asset.import_default_location');

        // Jika ada ZIP gambar, siapkan mapping filename => binary
        $images = [];
        if ($request->hasFile('images_zip')) {
            $zipPath = $request->file('images_zip')->getRealPath();
            $zip = new \ZipArchive();
            if ($zip->open($zipPath) === true) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = $zip->getNameIndex($i);
                    // abaikan folder
                    if (str_ends_with($name, '/')) {
                        continue;
                    }
                    $images[basename($name)] = $zip->getFromIndex($i);
                }
                $zip->close();
            }
        }

        $header = fgetcsv($handle);
        $rows = [];
        $line = 1;
        $existingCodes = Asset::pluck('id','code')->toArray();
        $existingSerials = Asset::pluck('id','serial_number')->filter()->toArray();
        $statuses = AssetStatus::pluck('id','name')->toArray();
        $categories = AssetCategory::pluck('id','name')->toArray();
        $locations = AssetLocation::pluck('id','name')->toArray();
        $defaultStatusId = $statuses[$defaultStatusName] ?? null;
        $defaultCategoryId = $categories[$defaultCategoryName] ?? null;
        $defaultLocationId = $locations[$defaultLocationName] ?? null;

        while (($data = fgetcsv($handle)) !== false) {
            $line++;
            if ($maxRows && ($line-1) > $maxRows) {
                break;
            }
            $row = array_combine($header, $data);
            if (!$row) {
                $rows[] = ['line' => $line, 'status' => 'error', 'message' => 'Header tidak sesuai', 'data' => $data];
                continue;
            }
            $code = $row['code'] ?? null;
            $serial = $row['serial_number'] ?? null;
            $name = $row['name'] ?? null;
            $errors = [];
            if (!$name) $errors[] = 'Nama wajib';

            $statusId = $statuses[$row['status'] ?? ''] ?? $defaultStatusId;
            $categoryId = $categories[$row['category'] ?? ''] ?? $defaultCategoryId;
            $locationId = $locations[$row['location'] ?? ''] ?? $defaultLocationId;

            $targetId = null;
            if ($dedupePriority === 'serial') {
                if ($serial && isset($existingSerials[$serial])) {
                    $targetId = $existingSerials[$serial];
                } elseif ($code && isset($existingCodes[$code])) {
                    $targetId = $existingCodes[$code];
                }
            } else {
                if ($code && isset($existingCodes[$code])) {
                    $targetId = $existingCodes[$code];
                } elseif ($serial && isset($existingSerials[$serial])) {
                    $targetId = $existingSerials[$serial];
                }
            }

            $rows[] = [
                'line' => $line,
                'status' => $errors ? 'invalid' : ($targetId ? 'update' : 'create'),
                'errors' => $errors,
                'payload' => [
                    'code' => $code,
                    'name' => $name,
                    'serial_number' => $serial,
                    'asset_status_id' => $statusId,
                    'asset_category_id' => $categoryId,
                    'asset_location_id' => $locationId,
                    'rfid_tag' => $row['rfid_tag'] ?? null,
                    'nfc_tag' => $row['nfc_tag'] ?? null,
                    'is_consumable' => !empty($row['is_consumable']),
                    'quantity' => (int) ($row['quantity'] ?? 1),
                    'available_quantity' => (int) ($row['available_quantity'] ?? $row['quantity'] ?? 1),
                    'is_pool' => !empty($row['is_pool']),
                    'image_url' => $row['image_url'] ?? null,
                    'image_file' => $row['image_file'] ?? null,
                ],
                'target_id' => $targetId,
            ];
        }
        fclose($handle);

        if ($action === 'preview') {
            session()->flash('import_preview', [
                'summary' => [
                    'create' => collect($rows)->where('status','create')->count(),
                    'update' => collect($rows)->where('status','update')->count(),
                    'invalid' => collect($rows)->where('status','invalid')->count(),
                ],
                'rows' => collect($rows)->take(50)->toArray(),
            ]);
            return back()->with('success', 'Preview import siap. Silakan cek tabel preview.');
        }

        // commit import
        $created = 0; $updated = 0; $invalid = 0;
        foreach ($rows as $row) {
            if ($row['status'] === 'invalid') { $invalid++; continue; }
            $payload = $row['payload'];
            $imageUrl = $payload['image_url'] ?? null;
            $imageFile = $payload['image_file'] ?? null;
            unset($payload['image_url'], $payload['image_file']);

            $assetModel = null;
            if ($row['target_id']) {
                $assetModel = Asset::find($row['target_id']);
                if ($assetModel) {
                    // gunakan service agar auto-generate tag & QR tetap konsisten
                    app(\App\Services\Asset\AssetService::class)->update($assetModel, $payload);
                    $updated++;
                }
            } else {
                if (!$payload['code']) {
                    $payload['code'] = 'IMP-'.Str::upper(Str::random(6));
                }
                $assetModel = app(\App\Services\Asset\AssetService::class)->create($payload);
                $created++;
            }

            // Tambahkan foto jika disediakan via URL atau file name di ZIP
            if ($assetModel) {
                $binary = null;
                if ($imageUrl) {
                    if ($allowRemoteImages) {
                        try {
                            $resp = \Illuminate\Support\Facades\Http::get($imageUrl);
                            if ($resp->ok()) {
                                $binary = $resp->body();
                            }
                        } catch (\Throwable $e) {
                            // abaikan error download agar import tetap lanjut
                        }
                    }
                } elseif ($imageFile && isset($images[$imageFile])) {
                    $binary = $images[$imageFile];
                }

                if ($binary) {
                    $path = "assets/{$assetModel->id}/import-".Str::random(6).".jpg";
                    \Illuminate\Support\Facades\Storage::disk('public')->put($path, $binary);
                    \App\Models\AssetPhoto::create([
                        'asset_id' => $assetModel->id,
                        'path' => $path,
                        'is_primary' => $assetModel->photos()->count() === 0,
                    ]);
                }
            }
        }

        return back()->with('success', "Import selesai. Create: {$created}, Update: {$updated}, Invalid: {$invalid}");
    }

    private function validateRequest(Request $request, ?string $assetId = null): array
    {
        $rfidRequired = $this->settings->get('asset.rfid_required', false);
        $nfcRequired  = $this->settings->get('asset.nfc_required', false);
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'asset_status_id' => ['nullable', 'uuid', 'exists:asset_statuses,id'],
            'asset_class_id' => ['nullable', 'uuid', 'exists:asset_classes,id'],
            'asset_category_id' => ['nullable', 'uuid', 'exists:asset_categories,id'],
            'unit_id' => ['nullable', 'uuid', 'exists:units,id'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'person_in_charge_id' => ['nullable', 'uuid', 'exists:person_in_charges,id'],
            'asset_user_id' => ['nullable', 'uuid', 'exists:asset_users,id'],
            'asset_location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
            'warranty_id' => ['nullable', 'uuid', 'exists:warranties,id'],
            'purchase_date' => ['nullable', 'date'],
            'warranty_end' => ['nullable', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'depreciation_method' => ['nullable', 'in:straight_line,diminishing'],
            'useful_life_months' => ['nullable', 'integer', 'min:1'],
            'residual_value' => ['nullable', 'numeric', 'min:0'],
            'capex_opex' => ['nullable', 'in:capex,opex'],
            'vendor_contract_id' => ['nullable', 'uuid', 'exists:vendor_contracts,id'],
            'metadata' => ['nullable', 'array'],
            'rfid_tag' => array_filter([
                'string','max:255',
                $rfidRequired ? 'required' : null,
                "unique:assets,rfid_tag,$assetId",
            ]),
            'nfc_tag' => array_filter([
                'string','max:255',
                $nfcRequired ? 'required' : null,
                "unique:assets,nfc_tag,$assetId",
            ]),
            'label_template' => ['nullable','string','max:100'],
            'is_consumable' => ['nullable','boolean'],
            'quantity' => ['nullable','integer','min:1'],
            'available_quantity' => ['nullable','integer','min:0'],
            'is_pool' => ['nullable','boolean'],
        ]);
    }
}
