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
use App\Services\Asset\AssetService;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(AssetService::class);

        $status = AssetStatus::first();
        $class = AssetClass::first();
        $category = AssetCategory::first();
        $unit = Unit::first();
        $dept = Department::first();
        $pic = PersonInCharge::first();
        $user = AssetUser::first();
        $location = AssetLocation::first();
        $warranty = Warranty::first();

        $names = [
            'Laptop Dell XPS 13',
            'Printer HP LaserJet',
            'Scanner Canon DR-C230',
            'Server Dell R740',
            'Router Mikrotik CCR',
            'Switch Cisco 2960',
            'Projector Epson EB-X06',
            'Monitor LG 27UL550',
            'UPS APC 1500VA',
            'Tablet iPad Air',
            'Smartphone Samsung S24',
            'Kursi Ergonomis',
            'Meja Kerja Kayu',
            'Lemari Arsip',
            'Camera CCTV Hikvision',
        ];

        foreach ($names as $index => $name) {
            $service->create([
                'name' => $name,
                'asset_status_id' => $status?->id,
                'asset_class_id' => $class?->id,
                'asset_category_id' => $category?->id,
                'unit_id' => $unit?->id,
                'department_id' => $dept?->id,
                'person_in_charge_id' => $pic?->id,
                'asset_user_id' => $user?->id,
                'asset_location_id' => $location?->id,
                'warranty_id' => $warranty?->id,
                'purchase_date' => now()->subDays(30 + $index),
                'cost' => 1000000 + ($index * 250000),
            ]);
        }
    }
}
