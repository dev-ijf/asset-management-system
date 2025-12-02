<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetChangelog;
use Illuminate\Database\Seeder;

class AssetChangelogSeeder extends Seeder
{
    public function run(): void
    {
        $assets = Asset::take(10)->get();

        foreach ($assets as $asset) {
            AssetChangelog::create([
                'asset_id' => $asset->id,
                'changed_by' => null,
                'changed_at' => now()->subDays(1),
                'changes' => ['action' => 'seed', 'data' => ['note' => 'Seeder changelog sample']],
            ]);
        }
    }
}
