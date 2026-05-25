<?php

namespace App\Providers;

use App\Models\Asset;
use App\Models\AssetAudit;
use App\Models\AssetDisposal;
use App\Models\AssetMaintenance;
use App\Models\AssetMovement;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Services\Logging\ActivityLogger;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AuditServiceProvider extends ServiceProvider
{
    private array $watchedModels = [
        Asset::class,
        AssetMovement::class,
        AssetDisposal::class,
        AssetAudit::class,
        AssetMaintenance::class,
        Setting::class,
        Role::class,
        Permission::class,
        User::class,
    ];

    public function boot(ActivityLogger $logger): void
    {
        foreach ($this->watchedModels as $model) {
            Event::listen("eloquent.created: {$model}", function ($instance) use ($logger) {
                $this->logModel($logger, $instance, 'created');
            });
            Event::listen("eloquent.updated: {$model}", function ($instance) use ($logger) {
                $this->logModel($logger, $instance, 'updated');
            });
            Event::listen("eloquent.deleted: {$model}", function ($instance) use ($logger) {
                $this->logModel($logger, $instance, 'deleted');
            });
        }
    }

    private function logModel(ActivityLogger $logger, $model, string $action): void
    {
        if (!config('system.security.audit_log', true)) {
            return;
        }

        $changes = [];
        if ($action === 'updated') {
            foreach ($model->getChanges() as $key => $newValue) {
                if (in_array($key, ['updated_at', 'created_at'], true)) {
                    continue;
                }
                $changes[$key] = [
                    'old' => $model->getOriginal($key),
                    'new' => $newValue,
                ];
            }
        } else {
            $changes = $model->getAttributes();
        }

        $logger->audit([
            'action' => "{$action}_model",
            'model' => class_basename($model),
            'model_fqcn' => get_class($model),
            'model_id' => $model->getKey(),
            'changes' => $changes,
            'route' => request()->route()?->getName(),
            'request_id' => app()->bound('audit.request_id') ? app('audit.request_id') : null,
        ]);
    }
}
