<?php

namespace Tests\Unit;

use App\Models\Setting;
use App\Services\System\SystemSettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reads_config_when_database_empty(): void
    {
        config([
            'system.asset.code_prefix' => 'CFG',
            'system.application.name' => 'Custom AMS',
        ]);

        $service = app(SystemSettingService::class);

        $this->assertSame('CFG', $service->get('asset.code_prefix'));
        $this->assertSame('Custom AMS', $service->get('application.name'));
    }

    public function test_it_prefers_database_overrides_and_casts_types(): void
    {
        // Simulasikan override via DB.
        Setting::create([
            'key' => 'asset.qr_enabled',
            'value' => false,
            'type' => 'boolean',
            'group' => 'asset',
        ]);

        Setting::create([
            'key' => 'ui.table_page_size',
            'value' => 50,
            'type' => 'integer',
            'group' => 'ui',
        ]);

        $service = app(SystemSettingService::class);

        // config default = true, namun DB override -> false
        $this->assertFalse($service->get('asset.qr_enabled'));
        $this->assertSame(50, $service->get('ui.table_page_size'));
    }

    public function test_it_sets_and_refreshes_cache_and_config(): void
    {
        $service = app(SystemSettingService::class);

        // Panggilan awal untuk memicu cache default.
        $this->assertFalse($service->get('maintenance.readonly_mode'));

        // Ubah via service, pastikan DB dan cache/config ter-update.
        $service->set('maintenance.readonly_mode', true);

        $this->assertDatabaseHas('settings', [
            'key' => 'maintenance.readonly_mode',
            'value' => '1',
            'type' => 'boolean',
        ]);

        $this->assertTrue($service->get('maintenance.readonly_mode'));
        $this->assertTrue(config('system.maintenance.readonly_mode'));
    }
}
