<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetDisposal extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'reason',
        'notes',
        'disposed_by',
        'disposed_at',
        'previous_status_id',
        'previous_location_id',
        'previous_department_id',
        'reversed_at',
        'reversed_by',
        'reversed_notes',
    ];

    protected $casts = [
        'disposed_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function previousStatus()
    {
        return $this->belongsTo(AssetStatus::class, 'previous_status_id');
    }

    public function previousLocation()
    {
        return $this->belongsTo(AssetLocation::class, 'previous_location_id');
    }

    public function previousDepartment()
    {
        return $this->belongsTo(Department::class, 'previous_department_id');
    }
}
