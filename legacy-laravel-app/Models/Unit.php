<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'symbol',
        'description',
    ];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
