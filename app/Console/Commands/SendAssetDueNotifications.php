<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Models\AssetAudit;
use App\Models\AssetMaintenance;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendAssetDueNotifications extends Command
{
    protected $signature = 'asset:notify-due';

    protected $description = 'Kirim notifikasi aset yang mendekati garansi habis, maintenance jatuh tempo, dan audit overdue.';

    public function handle(): int
    {
        $today = Carbon::today();

        $warrantyDays = (int) config('system.asset.warranty_reminder_days', 30);
        $warrantyDue = Asset::whereNotNull('warranty_end')
            ->whereBetween('warranty_end', [$today, $today->clone()->addDays($warrantyDays)])
            ->count();

        $maintenanceDue = AssetMaintenance::whereIn('status', ['planned', 'in_progress'])
            ->whereDate('performed_at', '<=', $today)
            ->count();

        $auditThresholdDays = 90;
        $auditOverdue = Asset::whereDoesntHave('audits', function ($q) use ($today, $auditThresholdDays) {
            $q->whereDate('audited_at', '>=', $today->clone()->subDays($auditThresholdDays));
        })->count();

        $message = sprintf(
            'Reminder: warranty due %d, maintenance due %d, audit overdue %d',
            $warrantyDue,
            $maintenanceDue,
            $auditOverdue
        );

        Log::channel('asset_activity')->info($message, [
            'warranty_due_in_days' => $warrantyDays,
            'audit_threshold_days' => $auditThresholdDays,
        ]);

        $this->info($message);

        return self::SUCCESS;
    }
}
