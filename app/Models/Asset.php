<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'serial_number',
        'description',
        'asset_status_id',
        'asset_class_id',
        'asset_category_id',
        'unit_id',
        'department_id',
        'person_in_charge_id',
        'asset_user_id',
        'asset_location_id',
        'warranty_id',
        'purchase_date',
        'warranty_end',
        'cost',
        'qr_token',
        'qr_path',
        'metadata',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_end' => 'date',
        'metadata' => 'array',
    ];

    public function status()
    {
        return $this->belongsTo(AssetStatus::class, 'asset_status_id');
    }

    public function class()
    {
        return $this->belongsTo(AssetClass::class, 'asset_class_id');
    }

    public function category()
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function personInCharge()
    {
        return $this->belongsTo(PersonInCharge::class);
    }

    public function user()
    {
        return $this->belongsTo(AssetUser::class, 'asset_user_id');
    }

    public function location()
    {
        return $this->belongsTo(AssetLocation::class, 'asset_location_id');
    }

    public function warranty()
    {
        return $this->belongsTo(Warranty::class);
    }

    public function histories()
    {
        return $this->hasMany(AssetHistory::class);
    }

    public function movements()
    {
        return $this->hasMany(AssetMovement::class);
    }

    public function disposals()
    {
        return $this->hasMany(AssetDisposal::class);
    }

    public function audits()
    {
        return $this->hasMany(AssetAudit::class);
    }

    public function maintenances()
    {
        return $this->hasMany(AssetMaintenance::class);
    }

    public function photos()
    {
        return $this->hasMany(AssetPhoto::class);
    }

    public function primaryPhoto()
    {
        return $this->hasOne(AssetPhoto::class)->where('is_primary', true);
    }

    public function changelogs()
    {
        return $this->hasMany(AssetChangelog::class);
    }
}
