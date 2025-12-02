<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetApprovalRequest;
use App\Models\AssetDisposal;
use App\Models\AssetMaintenance;
use App\Models\AssetMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ApprovalSeeder extends Seeder
{
    public function run(): void
    {
        $asset = Asset::first();
        $user = User::first();

        if (!$asset || !$user) {
            return;
        }

        // Pending movement approval
        $movement = AssetMovement::create([
            'asset_id' => $asset->id,
            'from_location_id' => $asset->asset_location_id,
            'to_location_id' => $asset->asset_location_id,
            'from_department_id' => $asset->department_id,
            'to_department_id' => $asset->department_id,
            'from_asset_user_id' => $asset->asset_user_id,
            'to_asset_user_id' => $asset->asset_user_id,
            'notes' => 'Seeder movement menunggu approval',
            'moved_by' => $user->id,
            'performed_at' => now(),
            'status' => 'pending',
            'requested_by' => $user->id,
        ]);
        AssetApprovalRequest::create([
            'id' => Str::uuid(),
            'approvable_id' => $movement->id,
            'approvable_type' => AssetMovement::class,
            'type' => 'movement',
            'status' => 'pending',
            'current_step' => 1,
            'required_steps' => 1,
            'requested_by' => $user->id,
        ]);

        // Pending disposal approval
        $disposal = AssetDisposal::create([
            'asset_id' => $asset->id,
            'reason' => 'Seeder disposal menunggu approval',
            'notes' => null,
            'previous_status_id' => $asset->asset_status_id,
            'previous_location_id' => $asset->asset_location_id,
            'previous_department_id' => $asset->department_id,
            'status' => 'pending',
            'requested_by' => $user->id,
        ]);
        AssetApprovalRequest::create([
            'id' => Str::uuid(),
            'approvable_id' => $disposal->id,
            'approvable_type' => AssetDisposal::class,
            'type' => 'disposal',
            'status' => 'pending',
            'current_step' => 1,
            'required_steps' => 1,
            'requested_by' => $user->id,
        ]);

        // Pending maintenance approval
        $maintenance = AssetMaintenance::create([
            'asset_id' => $asset->id,
            'performed_at' => now()->addDays(3),
            'description' => 'Seeder maintenance menunggu approval',
            'vendor' => 'Vendor Seeder',
            'cost' => 250000,
            'status' => 'pending',
            'notes' => null,
            'requested_by' => $user->id,
        ]);
        AssetApprovalRequest::create([
            'id' => Str::uuid(),
            'approvable_id' => $maintenance->id,
            'approvable_type' => AssetMaintenance::class,
            'type' => 'maintenance',
            'status' => 'pending',
            'current_step' => 1,
            'required_steps' => 1,
            'requested_by' => $user->id,
        ]);
    }
}
