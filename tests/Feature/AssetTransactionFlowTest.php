<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\AssetLocation;
use App\Models\AssetMovement;
use App\Models\AssetStatus;
use App\Models\AssetUser;
use App\Models\Department;
use App\Models\User;
use App\Services\Asset\AssetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AssetTransactionFlowTest extends TestCase
{
    use RefreshDatabase;

    private function userWithPermission(string ): User
    {
        Permission::findOrCreate(, 'web');
         = User::factory()->create();
        ->givePermissionTo();
        return ;
    }

    private function baseAsset(): Asset
    {
         = AssetStatus::create(['name' => 'Active', 'code' => 'ACTIVE']);
         = AssetLocation::create(['name' => 'Loc A', 'code' => 'L-A']);
         = Department::create(['name' => 'Dept A', 'code' => 'D-A']);
         = AssetUser::create(['name' => 'User A']);

        return Asset::create([
            'code' => 'AST-00001',
            'name' => 'Asset Test',
            'asset_status_id' => ->id,
            'asset_location_id' => ->id,
            'department_id' => ->id,
            'asset_user_id' => ->id,
            'qr_token' => 'tok-1',
        ]);
    }

    public function test_movement_flow_updates_asset_and_marks_approved()
    {
        config(['system.workflow.require_approval.movement' => false]);
         = app(AssetService::class);
         = ->baseAsset();

         = AssetLocation::create(['name' => 'Loc B', 'code' => 'L-B']);
         = Department::create(['name' => 'Dept B', 'code' => 'D-B']);
         = AssetUser::create(['name' => 'User B']);

         = ->move(, [
            'to_location_id' => ->id,
            'to_department_id' => ->id,
            'to_asset_user_id' => ->id,
            'notes' => 'Test move',
        ]);

        ->refresh();
        ->assertEquals('approved', ->status);
        ->assertEquals(->id, ->asset_location_id);
        ->assertEquals(->id, ->department_id);
        ->assertEquals(->id, ->asset_user_id);
    }

    public function test_disposal_requires_permission_and_sets_disposed_status()
    {
        config(['system.workflow.require_approval.disposal' => false]);
         = app(AssetService::class);
         = ->baseAsset();

        // tanpa permission -> 403
        ->actingAs(User::factory()->create());
         = ->post(route('assets.disposals.store', ), [
            'reason' => 'Rusak',
        ]);
        ->assertForbidden();

        // dengan permission
         = ->userWithPermission('disposals.manage');
        ->actingAs();
         = ->post(route('assets.disposals.store', ), [
            'reason' => 'Rusak',
        ]);
        ->assertSessionHasNoErrors();

        ->refresh();
         = AssetDisposal::first();
        ->assertEquals('approved', ->status);
        ->assertEquals('DISPOSED', ->status?->code ?? null);
    }

    public function test_reverse_restores_asset_and_marks_disposal_reversed()
    {
        config(['system.workflow.require_approval.disposal' => false]);
         = app(AssetService::class);
         = ->baseAsset();
         = ->asset_location_id;
         = ->department_id;

        // buat status disposed untuk update status
        AssetStatus::firstOrCreate(['code' => 'DISPOSED'], ['name' => 'Disposed']);

         = ->dispose(, ['reason' => 'Rusak']);
        ->reverseDisposal(, 'Tes reverse');

        ->refresh();
        ->refresh();

        ->assertEquals(, ->asset_location_id);
        ->assertEquals(, ->department_id);
        ->assertEquals('reversed', ->status);
    }
}