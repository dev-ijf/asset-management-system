<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetApprovalRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'approvable_id',
        'approvable_type',
        'type',
        'status',
        'current_step',
        'required_steps',
        'requested_by',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'decision_notes',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function approvable()
    {
        return $this->morphTo();
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
