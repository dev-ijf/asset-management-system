<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorContract extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'vendor_name',
        'contract_number',
        'start_date',
        'end_date',
        'sla_response_hours',
        'sla_resolution_hours',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
