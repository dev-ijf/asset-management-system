<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetUser extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'department_id',
        'notes',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function assets()
    {
        return $this->hasMany(Asset::class, 'asset_user_id');
    }
}
