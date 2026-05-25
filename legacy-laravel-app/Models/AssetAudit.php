<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetAudit extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'status', // matched, missing, damaged
        'notes',
        'audited_by',
        'audited_at',
        'location_id',
    ];

    protected $casts = [
        'audited_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function location()
    {
        return $this->belongsTo(AssetLocation::class, 'location_id');
    }
}
