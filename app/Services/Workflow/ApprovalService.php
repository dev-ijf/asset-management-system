<?php

namespace App\Services\Workflow;

use App\Models\Asset;
use App\Models\AssetApprovalRequest;
use App\Models\AssetDisposal;
use App\Models\AssetMaintenance;
use App\Models\AssetMovement;
use App\Services\Logging\ActivityLogger;
use App\Models\Role;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\DB;
use App\Notifications\ApprovalRequestedNotification;
use App\Notifications\ApprovalDecisionNotification;

class ApprovalService
{
    public function __construct(private readonly ActivityLogger $logger)
    {
    }

    public function create(string $type, $model): AssetApprovalRequest
    {
        $approval = AssetApprovalRequest::create([
            'approvable_id' => $model->getKey(),
            'approvable_type' => get_class($model),
            'type' => $type,
            'status' => 'pending',
            'requested_by' => auth()->id(),
            'current_step' => 1,
            'required_steps' => config("system.workflow.required_steps.{$type}", 1),
        ]);
        $this->notifyApprovers($approval);
        return $approval;
    }

    public function approve(AssetApprovalRequest $approval, ?string $notes = null): void
    {
        DB::transaction(function () use ($approval, $notes) {
            if ($approval->status !== 'pending') {
                return;
            }
            $approval->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'decision_notes' => $notes,
                'current_step' => $approval->required_steps,
            ]);

            $this->applyApprovedAction($approval);

            $this->logger->audit([
                'action' => 'approval_approved',
                'model' => class_basename($approval->approvable_type),
                'model_id' => $approval->approvable_id,
                'changes' => ['approval_id' => $approval->id, 'notes' => $notes],
            ]);

            $this->notifyDecision($approval, true, $notes);
        });
    }

    public function reject(AssetApprovalRequest $approval, ?string $notes = null): void
    {
        if ($approval->status !== 'pending') {
            return;
        }

        $approval->update([
            'status' => 'rejected',
            'rejected_by' => auth()->id(),
            'rejected_at' => now(),
            'decision_notes' => $notes,
        ]);

        $this->logger->audit([
            'action' => 'approval_rejected',
            'model' => class_basename($approval->approvable_type),
            'model_id' => $approval->approvable_id,
            'changes' => ['approval_id' => $approval->id, 'notes' => $notes],
        ]);

        $this->notifyDecision($approval, false, $notes);
    }

    private function applyApprovedAction(AssetApprovalRequest $approval): void
    {
        $approvable = $approval->approvable;

        if ($approvable instanceof AssetMovement) {
            $asset = $approvable->asset;
            $asset->update([
                'asset_location_id' => $approvable->to_location_id ?? $asset->asset_location_id,
                'department_id' => $approvable->to_department_id ?? $asset->department_id,
                'asset_user_id' => $approvable->to_asset_user_id ?? $asset->asset_user_id,
            ]);
            $approvable->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);
        }

        if ($approvable instanceof AssetDisposal) {
            $disposedStatus = optional($approvable->asset)->status?->code === 'DISPOSED'
                ? $approvable->asset->asset_status_id
                : \App\Models\AssetStatus::where('code', 'DISPOSED')->value('id');

            $approvable->asset->update([
                'asset_status_id' => $disposedStatus ?? $approvable->asset->asset_status_id,
            ]);
            $approvable->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);
        }

        if ($approvable instanceof AssetMaintenance) {
            $approvable->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);
        }
    }

    private function notifyApprovers(AssetApprovalRequest $approval): void
    {
        $approvers = Role::where('name', 'super-admin')->first()?->users ?? collect();
        if ($approvers->isEmpty()) {
            return;
        }

        Notification::send($approvers, new ApprovalRequestedNotification($approval));
        $this->logger->audit([
            'action' => 'notify_approval_request',
            'changes' => ['approval_id' => $approval->id],
        ]);
    }

    private function notifyDecision(AssetApprovalRequest $approval, bool $approved, ?string $notes = null): void
    {
        if ($approval->requested_by) {
            $requester = \App\Models\User::find($approval->requested_by);
            if ($requester) {
                $requester->notify(new ApprovalDecisionNotification($approval, $approved, $notes));
            }
        }
    }
}
