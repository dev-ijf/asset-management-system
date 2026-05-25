<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetHistory extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'action',
        'description',
        'changed_by',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
