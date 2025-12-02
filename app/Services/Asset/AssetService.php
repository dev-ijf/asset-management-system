<?php

namespace App\Services\Asset;

use App\Models\Asset;
use App\Models\AssetHistory;
use App\Services\System\SystemSettingService;
use App\Models\AssetStatus;
use App\Models\AssetMovement;
use App\Models\AssetDisposal;
use App\Models\AssetAudit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AssetService
{
    public function __construct(private readonly SystemSettingService $settings)
    {
    }

    /**
     * Buat aset baru dengan kode otomatis berdasarkan setting.
     */
    public function create(array $data): Asset
    {
        return DB::transaction(function () use ($data) {
            $data['code'] = $this->generateCode();
            $data['qr_token'] = $data['qr_token'] ?? Str::uuid()->toString();

            // Hitung warranty_end jika ada warranty dan purchase_date
            if (!empty($data['purchase_date']) && empty($data['warranty_end'])) {
                $days = (int) $this->settings->get('asset.warranty_reminder_days', 0);
                if ($days > 0) {
                    $data['warranty_end'] = now()->parse($data['purchase_date'])->addDays($days);
                }
            }

            $asset = Asset::create($data);

            $this->generateQr($asset);
            $this->logHistory($asset, 'created', 'Aset dibuat', $data);

            return $asset;
        });
    }

    /**
     * Perbarui aset dan catat riwayat.
     */
    public function update(Asset $asset, array $data): Asset
    {
        return DB::transaction(function () use ($asset, $data) {
            $asset->update($data);
            $this->generateQr($asset);
            $this->logHistory($asset, 'updated', 'Aset diperbarui', $data);

            return $asset;
        });
    }

    private function generateCode(): string
    {
        $prefix = $this->settings->get('asset.code_prefix', 'AST');
        $last = Asset::where('code', 'like', $prefix.'-%')
            ->orderByDesc('code')
            ->value('code');

        $nextNumber = 1;
        if ($last && preg_match('/\d+$/', $last, $m)) {
            $nextNumber = ((int) $m[0]) + 1;
        }

        return sprintf('%s-%05d', $prefix, $nextNumber);
    }

    public function logHistory(Asset $asset, string $action, string $description, array $payload = []): void
    {
        AssetHistory::create([
            'asset_id' => $asset->id,
            'action' => $action,
            'description' => $description,
            'changed_by' => auth()->id(),
            'payload' => $payload,
        ]);
    }

    private function generateQr(Asset $asset): void
    {
        $path = "qr/{$asset->code}.svg";
        $url = route('assets.public.show', $asset);

        $image = QrCode::format('svg')
            ->size(300)
            ->margin(1)
            ->generate($url);

        Storage::disk('public')->put($path, $image);

        $asset->updateQuietly(['qr_path' => $path]);
    }

    /**
     * Catat movement aset lalu update lokasi/departemen.
     */
    public function move(Asset $asset, array $data): AssetMovement
    {
        return DB::transaction(function () use ($asset, $data) {
            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'from_location_id' => $asset->asset_location_id,
                'to_location_id' => $data['to_location_id'] ?? null,
                'from_department_id' => $asset->department_id,
                'to_department_id' => $data['to_department_id'] ?? null,
                'from_asset_user_id' => $asset->asset_user_id,
                'to_asset_user_id' => $data['to_asset_user_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'moved_by' => auth()->id(),
                'performed_at' => $data['performed_at'] ?? now(),
            ]);

            $asset->update([
                'asset_location_id' => $data['to_location_id'] ?? $asset->asset_location_id,
                'department_id' => $data['to_department_id'] ?? $asset->department_id,
                'asset_user_id' => $data['to_asset_user_id'] ?? $asset->asset_user_id,
            ]);

            $this->logHistory($asset, 'movement', 'Perpindahan aset', $movement->toArray());

            return $movement;
        });
    }

    /**
     * Catat disposal dan ubah status aset (jika ada status DISPOSED).
     */
    public function dispose(Asset $asset, array $data): AssetDisposal
    {
        return DB::transaction(function () use ($asset, $data) {
            $disposal = AssetDisposal::create([
                'asset_id' => $asset->id,
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
                'disposed_by' => auth()->id(),
                'disposed_at' => $data['disposed_at'] ?? now(),
                'previous_status_id' => $asset->asset_status_id,
                'previous_location_id' => $asset->asset_location_id,
                'previous_department_id' => $asset->department_id,
            ]);

            // Ubah status aset ke DISPOSED bila tersedia
            $disposedStatus = AssetStatus::where('code', 'DISPOSED')->first();
            $asset->update([
                'asset_status_id' => $disposedStatus?->id ?? $asset->asset_status_id,
            ]);

            $this->logHistory($asset, 'disposal', 'Aset didispose', $disposal->toArray());

            return $disposal;
        });
    }

    /**
     * Reverse disposal dan kembalikan status/lokasi/departemen sebelumnya.
     */
    public function reverseDisposal(AssetDisposal $disposal, ?string $notes = null): Asset
    {
        return DB::transaction(function () use ($disposal, $notes) {
            $asset = $disposal->asset;

            $asset->update([
                'asset_status_id' => $disposal->previous_status_id,
                'asset_location_id' => $disposal->previous_location_id,
                'department_id' => $disposal->previous_department_id,
            ]);

            $disposal->update([
                'reversed_at' => now(),
                'reversed_by' => auth()->id(),
                'reversed_notes' => $notes,
            ]);

            $this->logHistory($asset, 'reverse_disposal', 'Aset di-restore dari disposal', [
                'disposal_id' => $disposal->id,
                'notes' => $notes,
            ]);

            return $asset;
        });
    }

    /**
     * Catat audit aset untuk memastikan kesesuaian fisik vs sistem.
     */
    public function audit(Asset $asset, array $data): AssetAudit
    {
        return DB::transaction(function () use ($asset, $data) {
            $audit = AssetAudit::create([
                'asset_id' => $asset->id,
                'status' => $data['status'],
                'notes' => $data['notes'] ?? null,
                'audited_by' => auth()->id(),
                'audited_at' => $data['audited_at'] ?? now(),
                'location_id' => $data['location_id'] ?? $asset->asset_location_id,
            ]);

            $this->logHistory($asset, 'audit', 'Audit aset', $audit->toArray());

            return $audit;
        });
    }
}
