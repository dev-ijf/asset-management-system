<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetMaintenance extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'performed_at',
        'description',
        'vendor',
        'cost',
        'status',
        'notes',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'cost' => 'decimal:2',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
