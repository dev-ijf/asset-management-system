<?php

namespace Tests\Feature;

use App\Models\AssetStatus;
use App\Services\Asset\AssetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AssetTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_asset_respects_code_prefix_from_setting(): void
    {
        config(['system.asset.code_prefix' => 'ASTX']);
        $status = AssetStatus::create(['name' => 'Aktif', 'code' => 'ACTIVE']);

        $asset = app(AssetService::class)->create([
            'name' => 'Laptop Uji',
            'asset_status_id' => $status->id,
        ]);

        $this->assertStringStartsWith('ASTX-', $asset->code);
    }

    public function test_qr_generated_and_stored(): void
    {
        Storage::fake('public');
        $status = AssetStatus::create(['name' => 'Aktif', 'code' => 'ACTIVE']);

        $asset = app(AssetService::class)->create([
            'name' => 'Laptop Uji 2',
            'asset_status_id' => $status->id,
        ]);

        $this->assertNotNull($asset->qr_path);
        Storage::disk('public')->assertExists($asset->qr_path);
    }
}
