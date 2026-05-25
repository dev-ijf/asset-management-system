<?php

namespace App\Notifications;

use App\Models\AssetApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalRequestedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly AssetApprovalRequest $approval)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $approvable = $this->approval->approvable;
        $title = ucfirst($this->approval->type) . ' membutuhkan persetujuan';
        $assetCode = method_exists($approvable, 'asset') ? optional($approvable->asset)->code : null;

        return (new MailMessage)
            ->subject($title)
            ->line($title)
            ->lineIf($assetCode, "Asset: {$assetCode}")
            ->line('Diminta oleh: '.optional($this->approval->requester)->name)
            ->line('Klik tombol di bawah untuk membuka dashboard dan meninjau.')
            ->action('Buka Dashboard', url('/dashboard/index'));
    }
}
