<?php

namespace App\Services\Asset;

use App\Models\Asset;
use App\Models\AssetHistory;
use App\Services\System\SystemSettingService;
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

    private function logHistory(Asset $asset, string $action, string $description, array $payload = []): void
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
        $url = route('assets.show', $asset);

        $image = QrCode::format('svg')
            ->size(300)
            ->margin(1)
            ->generate($url);

        Storage::disk('public')->put($path, $image);

        $asset->updateQuietly(['qr_path' => $path]);
    }
}
