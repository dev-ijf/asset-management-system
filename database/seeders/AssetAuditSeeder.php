<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetLocation;
use App\Services\Asset\AssetService;
use Illuminate\Database\Seeder;

class AssetAuditSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(AssetService::class);
        $assets = Asset::take(10)->get();
        $locations = AssetLocation::pluck('id')->toArray();
        $statuses = ['matched', 'missing', 'damaged'];

        foreach ($assets as $index => $asset) {
            $service->audit($asset, [
                'status' => $statuses[$index % count($statuses)],
                'notes' => 'Audit sample ' . ($index + 1),
                'location_id' => $locations[array_rand($locations)] ?? $asset->asset_location_id,
            ]);
        }
    }
}
