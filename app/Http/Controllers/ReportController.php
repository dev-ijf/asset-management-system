<?php
namespace App\Http\Controllers;

use App\Exports\ArrayReportExport;
use App\Exports\AssetFullReportExport;
use App\Models\Asset;
use App\Models\AssetAudit;
use App\Models\AssetCategory;
use App\Models\AssetClass;
use App\Models\AssetDisposal;
use App\Models\AssetLocation;
use App\Models\AssetMovement;
use App\Models\AssetStatus;
use App\Models\AssetUser;
use App\Models\Department;
use App\Models\PersonInCharge;
use App\Models\Warranty;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function assets(Request $request)
    {
        $filters = $request->only([
            'date_from', 'date_to', 'asset_status_id', 'asset_class_id', 'asset_category_id',
            'asset_location_id', 'department_id', 'asset_user_id', 'person_in_charge_id', 'warranty_id',
        ]);

        $query = Asset::with(['status', 'class', 'category', 'location', 'department', 'user', 'personInCharge', 'warranty'])
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($filters['asset_status_id'] ?? null, fn($q, $v) => $q->where('asset_status_id', $v))
            ->when($filters['asset_class_id'] ?? null, fn($q, $v) => $q->where('asset_class_id', $v))
            ->when($filters['asset_category_id'] ?? null, fn($q, $v) => $q->where('asset_category_id', $v))
            ->when($filters['asset_location_id'] ?? null, fn($q, $v) => $q->where('asset_location_id', $v))
            ->when($filters['department_id'] ?? null, fn($q, $v) => $q->where('department_id', $v))
            ->when($filters['asset_user_id'] ?? null, fn($q, $v) => $q->where('asset_user_id', $v))
            ->when($filters['person_in_charge_id'] ?? null, fn($q, $v) => $q->where('person_in_charge_id', $v))
            ->when($filters['warranty_id'] ?? null, fn($q, $v) => $q->where('warranty_id', $v));

        $assets = $query->paginate(config('system.ui.table_page_size', 20))->withQueryString();

        if ($request->get('export') === 'excel') {
            $assetsCollection = $query->get();

            $assetRows = $assetsCollection->map(fn($a) => [
                $a->code,
                $a->name,
                $a->status?->name,
                $a->category?->name,
                $a->location?->name,
                $a->department?->name,
                $a->user?->name,
                $a->personInCharge?->name,
                $a->warranty?->name,
                $a->created_at?->format('d/m/Y'),
            ])->toArray();

            $movementsRaw = AssetMovement::with(['asset', 'fromLocation', 'toLocation', 'fromDepartment', 'toDepartment', 'fromUser', 'toUser'])
                ->whereIn('asset_id', $assetsCollection->pluck('id'))
                ->get();

            $movements = $movementsRaw->values()->map(function ($m, $index) {
                $rowNumber   = $index + 2; // heading at row 1
                $codeCell    = "B{$rowNumber}";
                $nameFormula = "=IFERROR(XLOOKUP({$codeCell},Assets!A:A,Assets!B:B,\"\"),\"\")";
                return [
                    $m->performed_at?->format('d/m/Y H:i'),
                    $m->asset?->code,
                    $nameFormula,
                    $m->fromLocation?->name,
                    $m->toLocation?->name,
                    $m->fromDepartment?->name,
                    $m->toDepartment?->name,
                    $m->fromUser?->name,
                    $m->toUser?->name,
                    $m->notes,
                ];
            })->toArray();

            $disposalsRaw = AssetDisposal::with('asset')
                ->whereIn('asset_id', $assetsCollection->pluck('id'))
                ->get();

            $disposals = $disposalsRaw->values()->map(function ($d, $index) {
                $rowNumber   = $index + 2;
                $codeCell    = "B{$rowNumber}";
                $nameFormula = "=IFERROR(XLOOKUP({$codeCell},Assets!A:A,Assets!B:B,\"\"),\"\")";
                return [
                    $d->disposed_at?->format('d/m/Y H:i'),
                    $d->asset?->code,
                    $nameFormula,
                    $d->reason,
                    $d->notes,
                    $d->reversed_at ? 'Reversed' : 'Active',
                ];
            })->toArray();

            $auditsRaw = AssetAudit::with(['asset', 'location'])
                ->whereIn('asset_id', $assetsCollection->pluck('id'))
                ->get();

            $audits = $auditsRaw->values()->map(function ($a, $index) {
                $rowNumber   = $index + 2;
                $codeCell    = "B{$rowNumber}";
                $nameFormula = "=IFERROR(XLOOKUP({$codeCell},Assets!A:A,Assets!B:B,\"\"),\"\")";
                return [
                    $a->audited_at?->format('d/m/Y H:i'),
                    $a->asset?->code,
                    $nameFormula,
                    $a->status,
                    $a->location?->name,
                    $a->notes,
                ];
            })->toArray();

            return Excel::download(new AssetFullReportExport($assetRows, $movements, $disposals, $audits), 'asset-report.xlsx');
        }

        if ($request->get('export') === 'pdf') {
            $data = $query->get();
            $pdf  = Pdf::loadView('reports.exports.assets', compact('data'));
            return $pdf->download('asset-report.pdf');
        }

        return view('reports.assets', [
            'assets'      => $assets,
            'filters'     => $filters,
            'statuses'    => AssetStatus::orderBy('name')->get(),
            'classes'     => AssetClass::orderBy('name')->get(),
            'categories'  => AssetCategory::orderBy('name')->get(),
            'locations'   => AssetLocation::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'users'       => AssetUser::orderBy('name')->get(),
            'pics'        => PersonInCharge::orderBy('name')->get(),
            'warranties'  => Warranty::orderBy('name')->get(),
        ]);
    }

    public function movements(Request $request)
    {
        $filters = $request->only(['date_from', 'date_to', 'asset_id', 'asset_location_id', 'department_id', 'asset_user_id']);
        $query   = AssetMovement::with(['asset', 'toLocation', 'toDepartment', 'toUser', 'fromLocation', 'fromDepartment', 'fromUser'])
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->whereDate('performed_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->whereDate('performed_at', '<=', $v))
            ->when($filters['asset_id'] ?? null, fn($q, $v) => $q->where('asset_id', $v))
            ->when($filters['asset_location_id'] ?? null, fn($q, $v) => $q->where('to_location_id', $v))
            ->when($filters['department_id'] ?? null, fn($q, $v) => $q->where('to_department_id', $v))
            ->when($filters['asset_user_id'] ?? null, fn($q, $v) => $q->where('to_asset_user_id', $v));

        $items = $query->paginate(config('system.ui.table_page_size', 20))->withQueryString();

        if ($request->get('export') === 'excel') {
            $rows = $query->get()->map(fn($m) => [
                $m->performed_at?->format('d/m/Y H:i'),
                $m->asset?->code,
                $m->fromLocation?->name,
                $m->toLocation?->name,
                $m->fromDepartment?->name,
                $m->toDepartment?->name,
                $m->fromUser?->name,
                $m->toUser?->name,
                $m->notes,
            ])->toArray();
            return Excel::download(new ArrayReportExport([
                'Waktu', 'Aset', 'Dari Lokasi', 'Ke Lokasi', 'Dari Dept', 'Ke Dept', 'Dari User', 'Ke User', 'Catatan',
            ], $rows), 'asset-movement-report.xlsx');
        }

        if ($request->get('export') === 'pdf') {
            $data = $query->get();
            $pdf  = Pdf::loadView('reports.exports.movements', compact('data'));
            return $pdf->download('asset-movement-report.pdf');
        }

        return view('reports.movements', [
            'items'       => $items,
            'filters'     => $filters,
            'assets'      => Asset::orderBy('code')->get(),
            'locations'   => AssetLocation::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'users'       => AssetUser::orderBy('name')->get(),
        ]);
    }

    public function disposals(Request $request)
    {
        $filters = $request->only(['date_from', 'date_to', 'asset_id', 'status']);
        $query   = AssetDisposal::with('asset')
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->whereDate('disposed_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->whereDate('disposed_at', '<=', $v))
            ->when($filters['asset_id'] ?? null, fn($q, $v) => $q->where('asset_id', $v))
            ->when($filters['status'] ?? null, function ($q, $v) {
                $v === 'reversed' ? $q->whereNotNull('reversed_at') : $q->whereNull('reversed_at');
            });

        $items = $query->paginate(config('system.ui.table_page_size', 20))->withQueryString();

        if ($request->get('export') === 'excel') {
            $rows = $query->get()->map(fn($d) => [
                $d->disposed_at?->format('d/m/Y H:i'),
                $d->asset?->code,
                $d->reason,
                $d->notes,
                $d->reversed_at ? 'Reversed' : 'Active',
            ])->toArray();
            return Excel::download(new ArrayReportExport([
                'Waktu', 'Aset', 'Alasan', 'Catatan', 'Status',
            ], $rows), 'asset-disposal-report.xlsx');
        }

        if ($request->get('export') === 'pdf') {
            $data = $query->get();
            $pdf  = Pdf::loadView('reports.exports.disposals', compact('data'));
            return $pdf->download('asset-disposal-report.pdf');
        }

        return view('reports.disposals', [
            'items'   => $items,
            'filters' => $filters,
            'assets'  => Asset::orderBy('code')->get(),
        ]);
    }

    public function audits(Request $request)
    {
        $filters = $request->only(['date_from', 'date_to', 'asset_id', 'status', 'location_id']);
        $query   = AssetAudit::with(['asset', 'location'])
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->whereDate('audited_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->whereDate('audited_at', '<=', $v))
            ->when($filters['asset_id'] ?? null, fn($q, $v) => $q->where('asset_id', $v))
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['location_id'] ?? null, fn($q, $v) => $q->where('location_id', $v));

        $items = $query->paginate(config('system.ui.table_page_size', 20))->withQueryString();

        if ($request->get('export') === 'excel') {
            $rows = $query->get()->map(fn($a) => [
                $a->audited_at?->format('d/m/Y H:i'),
                $a->asset?->code,
                $a->status,
                $a->location?->name,
                $a->notes,
            ])->toArray();
            return Excel::download(new ArrayReportExport([
                'Waktu', 'Aset', 'Status', 'Lokasi', 'Catatan',
            ], $rows), 'asset-audit-report.xlsx');
        }

        if ($request->get('export') === 'pdf') {
            $data = $query->get();
            $pdf  = Pdf::loadView('reports.exports.audits', compact('data'));
            return $pdf->download('asset-audit-report.pdf');
        }

        return view('reports.audits', [
            'items'     => $items,
            'filters'   => $filters,
            'assets'    => Asset::orderBy('code')->get(),
            'locations' => AssetLocation::orderBy('name')->get(),
        ]);
    }

    public function depreciations(Request $request)
    {
        $filters = $request->only(['asset_class_id','asset_category_id','asset_status_id']);
        $query = Asset::with(['class','category','status','vendorContract'])
            ->when($filters['asset_class_id'] ?? null, fn($q,$v) => $q->where('asset_class_id',$v))
            ->when($filters['asset_category_id'] ?? null, fn($q,$v) => $q->where('asset_category_id',$v))
            ->when($filters['asset_status_id'] ?? null, fn($q,$v) => $q->where('asset_status_id',$v));

        $items = $query->paginate(config('system.ui.table_page_size', 20))->withQueryString();

        if ($request->get('export') === 'excel') {
            $rows = $query->get()->map(function($a){
                return [
                    $a->code,
                    $a->name,
                    $a->class?->name,
                    $a->category?->name,
                    $a->status?->name,
                    $a->purchase_date?->format('d/m/Y'),
                    $a->cost,
                    $a->residual_value,
                    $a->useful_life_months,
                    $a->depreciation_method,
                    $a->bookValue(),
                ];
            })->toArray();
            return Excel::download(new ArrayReportExport([
                'Kode','Nama','Kelas','Kategori','Status','Tgl Beli','Cost','Residual','Umur (bln)','Metode','Nilai Buku'
            ], $rows),'asset-depreciation.xlsx');
        }

        return view('reports.depreciations', [
            'items' => $items,
            'filters' => $filters,
            'classes' => AssetClass::orderBy('name')->get(),
            'categories' => AssetCategory::orderBy('name')->get(),
            'statuses' => AssetStatus::orderBy('name')->get(),
        ]);
    }
}
