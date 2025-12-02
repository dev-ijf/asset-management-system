<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssetPhotoController extends Controller
{
    public function store(Request $request, Asset $asset): RedirectResponse
    {
        $data = $request->validate([
            'photos' => ['required', 'array'],
            'photos.*' => [
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:' . (config('system.asset.attachment_max_size_mb', 20) * 1024),
            ],
        ]);

        $stored = 0;

        foreach ($data['photos'] as $file) {
            $path = $file->store("assets/{$asset->id}", 'public');

            AssetPhoto::create([
                'asset_id' => $asset->id,
                'path' => $path,
                'is_primary' => $asset->photos()->count() === 0,
            ]);
            $stored++;
        }

        return back()->with('success', "{$stored} foto aset berhasil diunggah.");
    }

    public function destroy(AssetPhoto $asset_photo): RedirectResponse
    {
        Storage::disk('public')->delete($asset_photo->path);
        $asset = $asset_photo->asset;
        $wasPrimary = $asset_photo->is_primary;
        $asset_photo->delete();

        if ($wasPrimary) {
            $next = $asset->photos()->first();
            if ($next) {
                $next->update(['is_primary' => true]);
            }
        }

        return back()->with('success', 'Foto aset berhasil dihapus.');
    }
}
