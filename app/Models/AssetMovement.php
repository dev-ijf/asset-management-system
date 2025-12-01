<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetMovement extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'from_location_id',
        'to_location_id',
        'from_department_id',
        'to_department_id',
        'notes',
        'moved_by',
        'performed_at',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function fromLocation()
    {
        return $this->belongsTo(AssetLocation::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(AssetLocation::class, 'to_location_id');
    }

    public function fromDepartment()
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment()
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }
}
