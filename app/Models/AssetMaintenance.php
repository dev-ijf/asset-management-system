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
        'requested_by',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'decision_notes',
        'sla_response_hours',
        'sla_resolution_hours',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'cost' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'sla_response_hours' => 'integer',
        'sla_resolution_hours' => 'integer',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function approval()
    {
        return $this->morphOne(AssetApprovalRequest::class, 'approvable');
    }
}
