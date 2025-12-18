<?php

namespace App\Services\Dashboard;

use App\Models\Asset;
use App\Models\AssetApprovalRequest;
use App\Models\AssetAudit;
use App\Models\AssetDisposal;
use App\Models\AssetLocation;
use App\Models\AssetMaintenance;
use App\Models\AssetMovement;
use App\Models\AssetStatus;
use App\Models\User;
use App\Services\System\SystemSettingService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    public function __construct(private readonly SystemSettingService $settings)
    {
    }

    /**
     * Menyusun seluruh data ringkasan untuk dashboard.
     *
     * Catatan:
     * - Menggunakan scoping per user (departemen/lokasi) jika user tidak punya permission `assets.view_all`.
     * - Menggunakan cache singkat untuk mengurangi beban query pada halaman yang sering diakses.
     */
    public function build(User $user): array
    {
        $cacheKey = sprintf('dashboard.summary.%s', $user->id);

        return Cache::remember($cacheKey, now()->addMinutes(2), function () use ($user) {
            $now = Carbon::now();
            $last30 = $now->copy()->subDays(30);
            $trendDays = 14;
            $trendStart = $now->copy()->subDays($trendDays - 1)->startOfDay();

            $warrantyDays = (int) $this->settings->get('asset.warranty_reminder_days', 30);
            $lowStockThreshold = (int) $this->settings->get('asset.consumable_low_stock_threshold', 5);

            $assetsQuery = Asset::query()->forUser($user);

            $totalAssets = (clone $assetsQuery)->count();
            $archivedAssets = (clone $assetsQuery)->whereNotNull('archived_at')->count();
            $softDeletedAssets = (clone $assetsQuery)->onlyTrashed()->count();

            $activeDisposals = AssetDisposal::query()
                ->whereNull('reversed_at')
                ->where('status', 'approved')
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->count();

            $movementCount30 = AssetMovement::query()
                ->where('created_at', '>=', $last30)
                ->where('status', 'approved')
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->count();

            $auditIssues = AssetAudit::query()
                ->whereIn('status', ['missing', 'damaged'])
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->count();

            $warrantyExpiring = (clone $assetsQuery)
                ->whereNotNull('warranty_end')
                ->whereBetween('warranty_end', [$now->toDateString(), $now->copy()->addDays($warrantyDays)->toDateString()])
                ->count();

            $maintenanceOpen = AssetMaintenance::query()
                ->whereIn('status', ['planned', 'in_progress', 'pending'])
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->count();

            $lowStockConsumables = (clone $assetsQuery)
                ->where('is_consumable', true)
                ->whereNotNull('available_quantity')
                ->where('available_quantity', '<=', $lowStockThreshold)
                ->count();

            $pendingApprovalsCount = AssetApprovalRequest::query()
                ->where('status', 'pending')
                ->count();

            $byStatus = AssetStatus::query()
                ->withCount(['assets as assets_count' => fn ($q) => $q->forUser($user)])
                ->orderBy('name')
                ->get()
                ->map(fn ($status) => ['label' => $status->name, 'value' => (int) $status->assets_count])
                ->values();

            $byLocation = AssetLocation::query()
                ->withCount(['assets as assets_count' => fn ($q) => $q->forUser($user)])
                ->orderByDesc('assets_count')
                ->orderBy('name')
                ->get()
                ->map(fn ($loc) => ['label' => $loc->name, 'value' => (int) $loc->assets_count])
                ->filter(fn ($row) => $row['value'] > 0)
                ->take(10)
                ->values();

            $trendLabels = $this->buildTrendLabels($trendStart, $trendDays);
            $movementTrend = $this->buildDailyTrend(
                AssetMovement::query()
                    ->where('status', 'approved')
                    ->whereHas('asset', fn ($q) => $q->forUser($user)),
                'created_at',
                $trendStart,
                $trendDays
            );
            $disposalTrend = $this->buildDailyTrend(
                AssetDisposal::query()
                    ->where('status', 'approved')
                    ->whereHas('asset', fn ($q) => $q->forUser($user)),
                'created_at',
                $trendStart,
                $trendDays
            );
            $auditIssueTrend = $this->buildDailyTrend(
                AssetAudit::query()
                    ->whereIn('status', ['missing', 'damaged'])
                    ->whereHas('asset', fn ($q) => $q->forUser($user)),
                'created_at',
                $trendStart,
                $trendDays
            );

            $recentAudits = AssetAudit::with(['asset'])
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->latest()
                ->take(5)
                ->get();

            $recentDisposals = AssetDisposal::with(['asset'])
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->latest()
                ->take(5)
                ->get();

            $recentMovements = AssetMovement::with(['asset', 'fromLocation', 'toLocation', 'fromDepartment', 'toDepartment', 'fromUser', 'toUser'])
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->latest()
                ->take(5)
                ->get();

            $pendingApprovals = AssetApprovalRequest::with(['approvable', 'requester'])
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get();

            $maintenanceDueSoon = AssetMaintenance::with('asset')
                ->whereIn('status', ['planned', 'in_progress', 'pending'])
                ->whereNotNull('performed_at')
                ->whereBetween('performed_at', [$now->copy()->subDays(1), $now->copy()->addDays(7)])
                ->whereHas('asset', fn ($q) => $q->forUser($user))
                ->orderBy('performed_at')
                ->take(5)
                ->get();

            $readonlyMode = (bool) $this->settings->get('maintenance.readonly_mode', false);

            return compact(
                'totalAssets',
                'archivedAssets',
                'softDeletedAssets',
                'movementCount30',
                'activeDisposals',
                'auditIssues',
                'warrantyExpiring',
                'maintenanceOpen',
                'lowStockConsumables',
                'pendingApprovalsCount',
                'byStatus',
                'byLocation',
                'trendLabels',
                'movementTrend',
                'disposalTrend',
                'auditIssueTrend',
                'recentAudits',
                'recentDisposals',
                'recentMovements',
                'pendingApprovals',
                'maintenanceDueSoon',
                'readonlyMode'
            );
        });
    }

    private function buildTrendLabels(Carbon $start, int $days): array
    {
        return collect(range(0, $days - 1))
            ->map(fn ($i) => $start->copy()->addDays($i)->format('d/m'))
            ->all();
    }

    /**
     * Menghasilkan array count per hari (panjang = $days) untuk dataset chart.
     */
    private function buildDailyTrend($query, string $dateColumn, Carbon $start, int $days): array
    {
        $end = $start->copy()->addDays($days)->endOfDay();

        /** @var Collection<string,int> $raw */
        $raw = $query
            ->whereBetween($dateColumn, [$start, $end])
            ->selectRaw('DATE(' . $dateColumn . ') as d, COUNT(*) as c')
            ->groupByRaw('DATE(' . $dateColumn . ')')
            ->pluck('c', 'd')
            ->map(fn ($v) => (int) $v);

        return collect(range(0, $days - 1))
            ->map(function ($i) use ($start, $raw) {
                $key = $start->copy()->addDays($i)->toDateString();
                return (int) ($raw[$key] ?? 0);
            })
            ->all();
    }
}

