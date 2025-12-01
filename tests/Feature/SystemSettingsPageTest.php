<?php

namespace Tests\Feature;

use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_index_displays_seeded_values(): void
    {
        $this->seed(SettingSeeder::class);

        $response = $this->get(route('settings.index'));

        $response->assertStatus(200);
        $response->assertSee('System Settings');
        $response->assertSee('asset.code_prefix');
        $response->assertSee('AST');
        $response->assertSee('ui.table_page_size');
        $response->assertSee('25');
    }
}
