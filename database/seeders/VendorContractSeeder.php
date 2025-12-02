<?php

namespace Database\Seeders;

use App\Models\VendorContract;
use Illuminate\Database\Seeder;

class VendorContractSeeder extends Seeder
{
    public function run(): void
    {
        $contracts = [
            [
                'vendor_name' => 'Vendor Default',
                'contract_number' => 'CNT-001',
                'start_date' => now()->subMonths(6),
                'end_date' => now()->addMonths(6),
                'sla_response_hours' => 4,
                'sla_resolution_hours' => 24,
                'notes' => 'Kontrak default untuk sample aset',
            ],
            [
                'vendor_name' => 'PT Tech Service',
                'contract_number' => 'CNT-002',
                'start_date' => now()->subMonths(3),
                'end_date' => now()->addMonths(9),
                'sla_response_hours' => 2,
                'sla_resolution_hours' => 12,
                'notes' => 'Support perangkat jaringan & server',
            ],
        ];

        foreach ($contracts as $c) {
            VendorContract::firstOrCreate(
                ['contract_number' => $c['contract_number']],
                $c
            );
        }
    }
}
