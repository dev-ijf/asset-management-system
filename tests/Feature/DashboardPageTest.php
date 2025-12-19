<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetApprovalRequest;
use App\Models\AssetAudit;
use App\Models\AssetDisposal;
use App\Models\AssetLocation;
use App\Models\AssetMaintenance;
use App\Models\AssetMovement;
use App\Models\AssetStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DashboardPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_loads_with_summary_data(): void
    {
        $user = User::factory()->create();

        $statusActive = AssetStatus::create(['name' => 'Active', 'code' => 'ACTIVE']);
        $statusRepair = AssetStatus::create(['name' => 'Repair', 'code' => 'REPAIR']);

        $locHq = AssetLocation::create(['name' => 'HQ', 'code' => 'HQ']);
        $locBranch = AssetLocation::create(['name' => 'Branch', 'code' => 'BR']);

        $asset1 = Asset::create([
            'code' => 'AST-001',
            'name' => 'Laptop A',
            'asset_status_id' => $statusActive->id,
            'asset_location_id' => $locHq->id,
            'qr_token' => (string) Str::uuid(),
            'warranty_end' => now()->addDays(7)->toDateString(),
            'cost' => 10000000,
        ]);
        $asset2 = Asset::create([
            'code' => 'AST-002',
            'name' => 'Printer B',
            'asset_status_id' => $statusRepair->id,
            'asset_location_id' => $locBranch->id,
            'qr_token' => (string) Str::uuid(),
            'warranty_end' => now()->addDays(10)->toDateString(),
            'cost' => 2500000,
        ]);
        $asset3 = Asset::create([
            'code' => 'AST-003',
            'name' => 'Tinta Printer',
            'asset_status_id' => $statusActive->id,
            'asset_location_id' => $locHq->id,
            'qr_token' => (string) Str::uuid(),
            'is_consumable' => true,
            'quantity' => 10,
            'available_quantity' => 3,
        ]);

        // Arsip & trash (soft delete).
        $asset2->update(['archived_at' => now()]);
        $asset3->delete();

        // Aktivitas: movement/disposal/audit issue/maintenance.
        $movement = AssetMovement::create([
            'asset_id' => $asset1->id,
            'status' => 'approved',
            'performed_at' => now()->subDays(2),
        ]);
        AssetDisposal::create([
            'asset_id' => $asset1->id,
            'status' => 'approved',
            'disposed_at' => now()->subDays(1),
            'reversed_at' => null,
        ]);
        AssetAudit::create([
            'asset_id' => $asset1->id,
            'status' => 'missing',
            'audited_at' => now()->subDays(1),
        ]);
        AssetMaintenance::create([
            'asset_id' => $asset1->id,
            'status' => 'planned',
            'performed_at' => now()->addDays(2),
            'description' => 'Preventive maintenance',
        ]);

        AssetApprovalRequest::create([
            'approvable_id' => $movement->id,
            'approvable_type' => AssetMovement::class,
            'type' => 'movement',
            'status' => 'pending',
            'requested_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('index'));

        $response->assertStatus(200);
        $response->assertSee('Dashboard');
        $response->assertViewHas('totalAssets', 2);
        $response->assertViewHas('archivedAssets', 1);
        $response->assertViewHas('softDeletedAssets', 1);
        $response->assertViewHas('pendingApprovalsCount', 1);
        $response->assertViewHas('warrantyExpiring', 2);
        $response->assertViewHas('auditIssues', 1);
    }
}
