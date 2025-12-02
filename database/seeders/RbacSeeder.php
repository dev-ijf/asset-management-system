<?php
namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RbacSeeder extends Seeder
{
    /**
     * Seed role dan permission dasar untuk sistem.
     */
    public function run(): void
    {
        $permissions = [
            'settings.manage',
            'users.manage',
            'roles.manage',
            'permissions.manage',
            'assets.view',
            'assets.manage',
            'movements.manage',
            'disposals.manage',
            'audits.manage',
            'maintenance.manage',
            'reports.view',
            'approvals.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web'],
            );
        }

        $adminRole    = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $assetManager = Role::firstOrCreate(['name' => 'asset-manager', 'guard_name' => 'web']);
        $auditor      = Role::firstOrCreate(['name' => 'auditor', 'guard_name' => 'web']);
        $maintenance  = Role::firstOrCreate(['name' => 'maintenance', 'guard_name' => 'web']);
        $viewer       = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);

        $adminRole->syncPermissions($permissions);

        $assetManager->syncPermissions([
            'assets.view', 'assets.manage', 'movements.manage', 'disposals.manage', 'maintenance.manage', 'audits.manage', 'reports.view', 'approvals.manage',
        ]);

        $auditor->syncPermissions([
            'assets.view', 'audits.manage', 'reports.view',
        ]);

        $maintenance->syncPermissions([
            'assets.view', 'maintenance.manage', 'movements.manage', 'reports.view',
        ]);

        $viewer->syncPermissions([
            'assets.view', 'reports.view',
        ]);

        // Buat akun admin default bila belum ada.
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('password123'),
            ]
        );
        $admin->syncRoles(['super-admin']);
    }
}
