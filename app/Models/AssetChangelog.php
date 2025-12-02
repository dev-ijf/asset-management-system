<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetChangelog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'changed_by',
        'changed_at',
        'changes',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
        'changes' => 'array',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
