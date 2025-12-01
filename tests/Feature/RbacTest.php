<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Permission;
use App\Models\Role;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_role_and_assign_permissions(): void
    {
        $perm = Permission::create(['name' => 'asset.create', 'guard_name' => 'web']);

        $response = $this->post(route('roles.store'), [
            'name' => 'admin',
            'permissions' => [$perm->getKey()],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['name' => 'admin']);
        $role = Role::whereName('admin')->first();
        $this->assertTrue($role->hasPermissionTo('asset.create'));
    }

    public function test_can_create_user_and_attach_role(): void
    {
        $role = Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        $response = $this->post(route('users.store'), [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [$role->getKey()],
        ]);

        $response->assertRedirect();
        $user = User::whereEmail('jane@example.com')->first();
        $this->assertTrue($user->hasRole('viewer'));
    }
}
