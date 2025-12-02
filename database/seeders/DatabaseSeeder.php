<?php
namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SettingSeeder::class,
            RbacSeeder::class,
            VendorContractSeeder::class,
            TwoFactorUserSeeder::class,
            MasterDataSeeder::class,
            AssetSeeder::class,
            AssetTransactionSeeder::class,
            AssetAuditSeeder::class,
            AssetChangelogSeeder::class,
            ApprovalSeeder::class,
        ]);
    }
}
