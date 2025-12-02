<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetLocation;
use App\Models\Department;
use App\Models\User;
use App\Services\Asset\AssetService;
use Illuminate\Database\Seeder;

class AssetTransactionSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan seeding transaksi menghasilkan data berstatus approved (tidak menggantung di approval).
        config(['system.workflow.require_approval.movement' => false]);
        config(['system.workflow.require_approval.disposal' => false]);

        $service = app(AssetService::class);
        $assets = Asset::take(10)->get();
        $locations = AssetLocation::take(2)->pluck('id')->toArray();
        $departments = Department::take(2)->pluck('id')->toArray();
        $approver = User::first();

        foreach ($assets as $asset) {
            if (!empty($locations)) {
                $movement = $service->move($asset, [
                    'to_location_id' => $locations[array_rand($locations)],
                    'to_department_id' => $departments[array_rand($departments)] ?? null,
                    'notes' => 'Seeder movement (approved)',
                ]);
                // Pastikan status approved (jika ada default/pending)
                $movement->update([
                    'status' => 'approved',
                    'approved_by' => $approver?->id,
                    'approved_at' => now(),
                ]);
            }
        }

        // Dispose satu aset untuk contoh reverse
        if ($assets->isNotEmpty()) {
            $asset = $assets->first();
            $disposal = $service->dispose($asset, [
                'reason' => 'Rusak berat',
                'notes' => 'Sample disposal (approved)',
            ]);
            $disposal->update([
                'status' => 'approved',
                'approved_by' => $approver?->id,
                'approved_at' => now(),
            ]);
            $service->reverseDisposal($disposal, 'Sample reverse');
        }
    }
}
