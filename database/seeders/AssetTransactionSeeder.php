<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetLocation;
use App\Models\Department;
use App\Services\Asset\AssetService;
use Illuminate\Database\Seeder;

class AssetTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(AssetService::class);
        $assets = Asset::take(10)->get();
        $locations = AssetLocation::take(2)->pluck('id')->toArray();
        $departments = Department::take(2)->pluck('id')->toArray();

        foreach ($assets as $asset) {
            if (!empty($locations)) {
                $service->move($asset, [
                    'to_location_id' => $locations[array_rand($locations)],
                    'to_department_id' => $departments[array_rand($departments)] ?? null,
                    'notes' => 'Seed movement',
                ]);
            }
        }

        // Dispose satu aset untuk contoh reverse
        if ($assets->isNotEmpty()) {
            $disposal = $service->dispose($assets->first(), [
                'reason' => 'Rusak berat',
                'notes' => 'Sample disposal',
            ]);
            $service->reverseDisposal($disposal, 'Sample reverse');
        }
    }
}
