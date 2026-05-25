<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetPhoto extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'path',
        'is_primary',
        'caption',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
