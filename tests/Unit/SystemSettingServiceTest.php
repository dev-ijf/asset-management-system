<?php

namespace Tests\Unit;

use App\Services\System\SystemSettingService;
use Tests\TestCase;

class SystemSettingServiceTest extends TestCase
{
    public function test_it_reads_system_settings_from_config(): void
    {
        // Override konfigurasi untuk memastikan service mengambil nilai terbaru.
        config([
            'system.asset.code_prefix' => 'ASTX',
            'system.application.name' => 'Custom AMS',
        ]);

        $service = app(SystemSettingService::class);

        $this->assertSame('ASTX', $service->get('asset.code_prefix'));
        $this->assertSame('Custom AMS', $service->get('application.name'));
        $this->assertTrue($service->get('asset.qr_enabled'));
    }

    public function test_it_can_override_runtime_settings(): void
    {
        $service = app(SystemSettingService::class);

        $service->set('ui.date_format', 'Y-m-d');

        $this->assertSame('Y-m-d', $service->get('ui.date_format'));
        $this->assertSame('Y-m-d', config('system.ui.date_format'));
    }
}
