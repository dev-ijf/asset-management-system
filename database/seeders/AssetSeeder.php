<?php

namespace Database\Seeders;

use App\Models\AssetCategory;
use App\Models\AssetClass;
use App\Models\AssetLocation;
use App\Models\AssetStatus;
use App\Models\AssetUser;
use App\Models\AssetPhoto;
use App\Models\Department;
use App\Models\PersonInCharge;
use App\Models\VendorContract;
use App\Models\Unit;
use App\Models\Warranty;
use App\Services\Asset\AssetService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

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
        $contract = VendorContract::firstOrCreate(
            ['contract_number' => 'CNT-001'],
            [
                'vendor_name' => 'Vendor Default',
                'start_date' => now()->subMonths(6),
                'end_date' => now()->addMonths(6),
                'sla_response_hours' => 4,
                'sla_resolution_hours' => 24,
                'notes' => 'Kontrak default untuk sample aset',
            ]
        );

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
            'Kursi Ergonomis', // aset furnitur contoh pool
            'Meja Kerja Kayu',
            'Lemari Arsip',
            'Camera CCTV Hikvision',
        ];

        $imagePool = [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df086?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1559163499-35d55e4857a8?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1481277542470-605612bd2d60?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        ];

        foreach ($names as $index => $name) {
            $asset = $service->create([
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
                'residual_value' => 500000,
                'useful_life_months' => 36,
                'depreciation_method' => $index % 2 === 0 ? 'straight_line' : 'diminishing',
                'capex_opex' => $index % 3 === 0 ? 'capex' : 'opex',
                'vendor_contract_id' => $contract->id,
                'rfid_tag' => sprintf('RFID-%05d', $index + 1),
                'nfc_tag' => sprintf('NFC-%05d', $index + 1),
                'label_template' => 'default',
                'is_consumable' => false,
                'quantity' => 1,
                'available_quantity' => 1,
                'is_pool' => in_array($name, ['Kursi Ergonomis', 'Meja Kerja Kayu', 'Lemari Arsip']),
            ]);

            // Download 2 foto berbeda untuk tiap aset dari pool.
            $pics = collect($imagePool)->shuffle()->take(2);
            foreach ($pics as $idx => $url) {
                $response = Http::get($url);
                if ($response->ok()) {
                    $path = "assets/{$asset->id}/photo-{$idx}.jpg";
                    Storage::disk('public')->put($path, $response->body());
                    AssetPhoto::create([
                        'asset_id' => $asset->id,
                        'path' => $path,
                        'is_primary' => $idx === 0 && $asset->photos()->count() === 0,
                    ]);
                }
            }
        }

        // Consumable & pool assets sample (stok/batch)
        $consumables = [
            ['name' => 'Tinta Printer Hitam', 'qty' => 50],
            ['name' => 'Kertas A4 80gsm', 'qty' => 200],
            ['name' => 'Baterai AA', 'qty' => 100],
            ['name' => 'Mouse Cadangan', 'qty' => 20],
        ];

        foreach ($consumables as $idx => $item) {
            $asset = $service->create([
                'name' => $item['name'],
                'asset_status_id' => $status?->id,
                'asset_class_id' => $class?->id,
                'asset_category_id' => $category?->id,
                'unit_id' => $unit?->id,
                'department_id' => $dept?->id,
                'person_in_charge_id' => $pic?->id,
                'asset_user_id' => $user?->id,
                'asset_location_id' => $location?->id,
                'warranty_id' => null,
                'purchase_date' => now()->subDays(10 + $idx),
                'cost' => 10000,
                'residual_value' => 0,
                'useful_life_months' => 12,
                'depreciation_method' => 'straight_line',
                'capex_opex' => 'opex',
                'vendor_contract_id' => $contract->id,
                'rfid_tag' => null,
                'nfc_tag' => null,
                'label_template' => 'small',
                'is_consumable' => true,
                'quantity' => $item['qty'],
                'available_quantity' => $item['qty'],
                'is_pool' => false,
            ]);

            // Gunakan foto generik untuk consumable
            $url = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
            $response = Http::get($url);
            if ($response->ok()) {
                $path = "assets/{$asset->id}/photo-consumable.jpg";
                Storage::disk('public')->put($path, $response->body());
                AssetPhoto::create([
                    'asset_id' => $asset->id,
                    'path' => $path,
                    'is_primary' => true,
                ]);
            }
        }
    }
}
