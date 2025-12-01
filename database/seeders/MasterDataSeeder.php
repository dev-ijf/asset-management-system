<?php

namespace Database\Seeders;

use App\Models\AssetCategory;
use App\Models\AssetClass;
use App\Models\AssetLocation;
use App\Models\AssetStatus;
use App\Models\AssetUser;
use App\Models\Department;
use App\Models\PersonInCharge;
use App\Models\Unit;
use App\Models\Warranty;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        AssetStatus::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Aktif', 'code' => 'ACTIVE', 'description' => 'Aset siap digunakan', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Maintenance', 'code' => 'MAINT', 'description' => 'Dalam perawatan', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Rusak', 'code' => 'BROKEN', 'description' => 'Butuh perbaikan/hasil inspeksi', 'created_at' => now(), 'updated_at' => now()],
        ]);

        AssetClass::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Elektronik', 'code' => 'ELEC', 'description' => 'Laptop, server, dll', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Furniture', 'code' => 'FURN', 'description' => 'Meja, kursi, lemari', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Unit::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Pieces', 'symbol' => 'pcs', 'description' => 'Satuan unit umum', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Kilogram', 'symbol' => 'kg', 'description' => 'Berat', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Department::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Keuangan', 'code' => 'FIN', 'description' => 'Departemen Finance', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'IT', 'code' => 'IT', 'description' => 'Departemen Teknologi', 'created_at' => now(), 'updated_at' => now()],
        ]);

        PersonInCharge::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Andi Saputra', 'email' => 'andi@example.com', 'phone' => '08123456789', 'notes' => 'Supervisor IT', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Rina Hartati', 'email' => 'rina@example.com', 'phone' => '08129876543', 'notes' => 'Finance lead', 'created_at' => now(), 'updated_at' => now()],
        ]);

        AssetUser::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Budi Santoso', 'email' => 'budi@example.com', 'phone' => '0811111111', 'department_id' => Department::where('code', 'IT')->first()->id ?? null, 'notes' => 'Pengguna laptop', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Siti Aminah', 'email' => 'siti@example.com', 'phone' => '0822222222', 'department_id' => Department::where('code', 'FIN')->first()->id ?? null, 'notes' => 'Pengguna scanner', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $categoryOffice = AssetCategory::create([
            'name' => 'Peralatan Kantor',
            'code' => 'OFFICE',
            'description' => 'Kategori umum peralatan kantor',
        ]);

        AssetCategory::create([
            'name' => 'Laptop',
            'code' => 'LAPTOP',
            'description' => 'Perangkat laptop',
            'parent_id' => $categoryOffice->id,
        ]);

        AssetLocation::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Gudang Pusat', 'code' => 'WH-01', 'description' => 'Gudang utama', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Lantai 2', 'code' => 'FL-02', 'description' => 'Area kantor lantai 2', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Warranty::insert([
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Garansi 1 Tahun', 'duration_months' => 12, 'notes' => 'Vendor default', 'created_at' => now(), 'updated_at' => now()],
            ['id' => \Illuminate\Support\Str::uuid(), 'name' => 'Garansi 3 Tahun', 'duration_months' => 36, 'notes' => 'Perangkat premium', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
