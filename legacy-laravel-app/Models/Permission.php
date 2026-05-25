<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    use HasUuids;

    protected $primaryKey = 'uuid';
    public $incrementing = false;
    protected $keyType = 'string';

    // Spatie masih memakai kolom "id" di beberapa operasi, jadi kembalikan nilai uuid.
    public function getIdAttribute(): ?string
    {
        return $this->attributes['uuid'] ?? null;
    }
}
