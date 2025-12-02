<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TwoFactorUserSeeder extends Seeder
{
    public function run(): void
    {
        // User tanpa 2FA (viewer)
        $viewer = User::firstOrCreate(
            ['email' => 'viewer@example.com'],
            [
                'name' => 'Viewer Default',
                'password' => Hash::make('password123'),
            ]
        );

        // User dengan 2FA aktif
        $twoFaUser = User::firstOrCreate(
            ['email' => 'secure@example.com'],
            [
                'name' => '2FA User',
                'password' => Hash::make('password123'),
            ]
        );

        $twoFaUser->forceFill([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP', // contoh secret base32
            'two_factor_recovery_codes' => [
                'RCVR-1234-ABCD',
                'RCVR-5678-EFGH',
                'RCVR-9012-IJKL',
                'RCVR-3456-MNOP',
            ],
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ])->save();
    }
}
