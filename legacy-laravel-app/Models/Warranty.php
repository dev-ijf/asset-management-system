<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warranty extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'duration_months',
        'notes',
    ];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
