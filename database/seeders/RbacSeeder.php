<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
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
            'user.view',
            'user.create',
            'user.update',
            'role.view',
            'role.manage',
            'permission.view',
            'permission.manage',
            'setting.manage',
            'asset.view',
            'asset.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web'],
            );
        }

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web']
        );
        $adminRole->syncPermissions($permissions);

        $viewerRole = Role::firstOrCreate(
            ['name' => 'viewer', 'guard_name' => 'web']
        );
        $viewerRole->syncPermissions([
            'user.view',
            'role.view',
            'permission.view',
            'setting.manage', // viewer tetap bisa lihat setting; atur sesuai kebutuhan.
            'asset.view',
        ]);

        // Buat akun admin default bila belum ada.
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password123'),
            ]
        );
        $admin->syncRoles(['admin']);
    }
}
