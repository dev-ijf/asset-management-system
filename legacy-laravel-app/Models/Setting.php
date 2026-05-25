<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'group',
        'type',
        'value',
        'description',
        'is_public',
    ];

    /**
     * Setter untuk menyimpan nilai dengan aman (array -> json).
     */
    public function setValueAttribute($value): void
    {
        if (is_array($value)) {
            $this->attributes['value'] = json_encode($value);
            $this->attributes['type'] = $this->attributes['type'] ?? 'array';

            return;
        }

        $this->attributes['value'] = (string) $value;
    }

    /**
     * Getter untuk casting nilai sesuai tipe yang disimpan.
     */
    public function getValueAttribute($value): mixed
    {
        return match ($this->type) {
            'bool', 'boolean' => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            'int', 'integer' => (int) $value,
            'float', 'double' => (float) $value,
            'array', 'json' => json_decode($value, true) ?? [],
            default => $value,
        };
    }
}
