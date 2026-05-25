<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasUuids;

    protected $primaryKey = 'uuid';
    public $incrementing = false;
    protected $keyType = 'string';

    // Spatie still memanggil kolom "id" saat sync role, map-kan ke uuid agar tidak null.
    public function getIdAttribute(): ?string
    {
        return $this->attributes['uuid'] ?? null;
    }
}
