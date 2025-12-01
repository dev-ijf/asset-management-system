<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Asset;
use App\Models\AssetStatus;
use App\Models\AssetLocation;
use App\Models\AssetMovement;
use App\Models\AssetDisposal;
use App\Models\AssetAudit;
use Carbon\Carbon;

class DashboardsController extends Controller
{
      
    public function index()
    {
        $now = Carbon::now();
        $last30 = $now->copy()->subDays(30);

        $totalAssets = Asset::count();
        $movementCount = AssetMovement::where('created_at', '>=', $last30)->count();
        $disposalCount = AssetDisposal::whereNull('reversed_at')->count();
        $auditIssues = AssetAudit::whereIn('status', ['missing','damaged'])->count();

        $byStatus = AssetStatus::orderBy('name')
            ->get()
            ->map(function ($status) {
                return [
                    'label' => $status->name,
                    'value' => $status->assets()->count(),
                ];
            });

        $byLocation = AssetLocation::orderBy('name')
            ->get()
            ->map(function ($loc) {
                return [
                    'label' => $loc->name,
                    'value' => $loc->assets()->count(),
                ];
            })->filter(fn($row) => $row['value'] > 0)->values();

        $recentAudits = AssetAudit::with('asset')
            ->latest()
            ->take(5)
            ->get();

        $recentDisposals = AssetDisposal::with('asset')
            ->latest()
            ->take(5)
            ->get();

        return view('pages.dashboards.index', compact(
            'totalAssets',
            'movementCount',
            'disposalCount',
            'auditIssues',
            'byStatus',
            'byLocation',
            'recentAudits',
            'recentDisposals'
        ));
    }

}
