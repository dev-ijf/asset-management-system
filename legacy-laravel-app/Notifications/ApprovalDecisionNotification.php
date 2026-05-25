<?php

namespace App\Notifications;

use App\Models\AssetApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalDecisionNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly AssetApprovalRequest $approval,
        private readonly bool $approved,
        private readonly ?string $notes = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->approved ? 'disetujui' : 'ditolak';
        $approvable = $this->approval->approvable;
        $assetCode = method_exists($approvable, 'asset') ? optional($approvable->asset)->code : null;

        return (new MailMessage)
            ->subject("Permintaan {$this->approval->type} {$status}")
            ->line("Permintaan {$this->approval->type} Anda telah {$status}.")
            ->lineIf($assetCode, "Asset: {$assetCode}")
            ->lineIf($this->notes, "Catatan: {$this->notes}")
            ->action('Buka Dashboard', url('/dashboard/index'));
    }
}
