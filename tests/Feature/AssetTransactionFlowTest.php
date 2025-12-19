<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\AssetLocation;
use App\Models\AssetMovement;
use App\Models\AssetStatus;
use App\Models\AssetUser;
use App\Models\Department;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AssetTransactionFlowTest extends TestCase
{
    use RefreshDatabase;

    private function userWithPermission(string $permission): User
    {
        Permission::findOrCreate($permission, 'web');

        $user = User::factory()->create();
        $user->givePermissionTo($permission);

        return $user;
    }

    private function baseAsset(): Asset
    {
        $status = AssetStatus::create(['name' => 'Active', 'code' => 'ACTIVE']);
        $loc = AssetLocation::create(['name' => 'Loc A', 'code' => 'L-A']);
        $dept = Department::create(['name' => 'Dept A', 'code' => 'D-A']);
        $assetUser = AssetUser::create(['name' => 'User A']);

        return Asset::create([
            'code' => 'AST-00001',
            'name' => 'Asset Test',
            'asset_status_id' => $status->id,
            'asset_location_id' => $loc->id,
            'department_id' => $dept->id,
            'asset_user_id' => $assetUser->id,
            'qr_token' => (string) Str::uuid(),
        ]);
    }

    public function test_movement_flow_updates_asset_and_marks_approved_when_auto_approve(): void
    {
        config(['system.workflow.require_approval.movement' => false]);

        $user = $this->userWithPermission('movements.manage');
        $asset = $this->baseAsset();

        $toLoc = AssetLocation::create(['name' => 'Loc B', 'code' => 'L-B']);
        $toDept = Department::create(['name' => 'Dept B', 'code' => 'D-B']);
        $toUser = AssetUser::create(['name' => 'User B']);

        $response = $this->actingAs($user)->post(route('assets.movements.store', $asset), [
            'to_location_id' => $toLoc->id,
            'to_department_id' => $toDept->id,
            'to_asset_user_id' => $toUser->id,
            'notes' => 'Test move',
        ]);

        $response->assertSessionHasNoErrors();

        $asset->refresh();
        $this->assertEquals($toLoc->id, $asset->asset_location_id);
        $this->assertEquals($toDept->id, $asset->department_id);
        $this->assertEquals($toUser->id, $asset->asset_user_id);

        $movement = AssetMovement::first();
        $this->assertNotNull($movement);
        $this->assertEquals('approved', $movement->status);
        $this->assertNotNull($movement->approved_at);
        $this->assertEquals($user->id, $movement->approved_by);
    }

    public function test_disposal_requires_permission_and_sets_disposed_status_when_auto_approve(): void
    {
        config(['system.workflow.require_approval.disposal' => false]);

        // Buat status disposed agar service mengubah status aset.
        AssetStatus::firstOrCreate(['code' => 'DISPOSED'], ['name' => 'Disposed']);

        $asset = $this->baseAsset();

        // Tanpa permission: harus 403 dari middleware `permission:disposals.manage`.
        $response = $this->actingAs(User::factory()->create())->post(route('assets.disposals.store', $asset), [
            'reason' => 'Rusak',
        ]);
        $response->assertForbidden();

        // Dengan permission: berhasil, status disposal approved, asset menjadi DISPOSED.
        $user = $this->userWithPermission('disposals.manage');
        $response = $this->actingAs($user)->post(route('assets.disposals.store', $asset), [
            'reason' => 'Rusak',
            'notes' => 'Pengujian disposal',
        ]);
        $response->assertSessionHasNoErrors();

        $asset->refresh();
        $disposal = AssetDisposal::first();
        $this->assertNotNull($disposal);
        $this->assertEquals('approved', $disposal->status);
        $this->assertEquals('DISPOSED', optional($asset->status)->code);
    }

    public function test_reverse_restores_asset_and_marks_disposal_reversed(): void
    {
        config(['system.workflow.require_approval.disposal' => false]);
        AssetStatus::firstOrCreate(['code' => 'DISPOSED'], ['name' => 'Disposed']);

        $user = $this->userWithPermission('disposals.manage');
        $asset = $this->baseAsset();
        $previousStatusId = $asset->asset_status_id;
        $previousLocationId = $asset->asset_location_id;
        $previousDepartmentId = $asset->department_id;

        $this->actingAs($user)->post(route('assets.disposals.store', $asset), [
            'reason' => 'Rusak',
        ])->assertSessionHasNoErrors();

        $disposal = AssetDisposal::first();
        $this->assertNotNull($disposal);

        $this->actingAs($user)->post(route('assets.disposals.reverse', $disposal), [
            'notes' => 'Tes reverse',
        ])->assertSessionHasNoErrors();

        $asset->refresh();
        $disposal->refresh();

        $this->assertEquals($previousStatusId, $asset->asset_status_id);
        $this->assertEquals($previousLocationId, $asset->asset_location_id);
        $this->assertEquals($previousDepartmentId, $asset->department_id);
        $this->assertEquals('reversed', $disposal->status);
        $this->assertNotNull($disposal->reversed_at);
    }
}
