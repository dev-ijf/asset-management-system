<?php

namespace Tests\Feature;

use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_asset_status(): void
    {
        $response = $this->post(route('asset-statuses.store'), [
            'name' => 'Uji',
            'code' => 'TEST',
            'description' => 'Status uji',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('asset_statuses', ['code' => 'TEST']);
    }

    public function test_can_create_asset_user_with_department(): void
    {
        $dept = Department::create(['name' => 'QA', 'code' => 'QA', 'description' => 'Quality Assurance']);

        $response = $this->post(route('asset-users.store'), [
            'name' => 'User QA',
            'email' => 'qa@example.com',
            'phone' => '0800000',
            'department_id' => $dept->id,
            'notes' => 'test',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('asset_users', ['email' => 'qa@example.com', 'department_id' => $dept->id]);
    }
}
