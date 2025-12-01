<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Http\Requests\SettingRequest;
use App\Services\System\SystemSettingService;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class SystemSettingController extends Controller
{
    public function index(SystemSettingService $service): View
    {
        // Ambil nilai yang sudah di-override (DB > config default).
        $resolved = $service->all();

        // Ambil meta dari DB untuk ditampilkan di tabel.
        $settings = Setting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get()
            ->groupBy('group');

        return view('settings.index', [
            'settingsByGroup' => $settings,
            'resolved' => $resolved,
        ]);
    }

    public function store(SettingRequest $request, SystemSettingService $service): RedirectResponse
    {
        $data = $request->validated();

        $service->set(
            $data['key'],
            $request->castedValue(),
            $data['type'] ?? null,
            $data['description'] ?? null,
            $data['group'] ?? null,
            $data['is_public'] ?? false
        );

        return redirect()->route('settings.index')->with('success', 'Setting berhasil ditambahkan.');
    }

    public function update(SettingRequest $request, Setting $setting, SystemSettingService $service): RedirectResponse
    {
        $data = $request->validated();
        // Hanya izinkan perubahan pada value; metadata mengikuti record lama.
        $data['key'] = $setting->key;
        $data['group'] = $setting->group;
        $data['type'] = $setting->type;
        $data['description'] = $setting->description;
        $data['is_public'] = $setting->is_public;

        $service->set(
            $data['key'],
            $request->castedValue(),
            $data['type'] ?? null,
            $data['description'] ?? null,
            $data['group'] ?? null,
            $data['is_public'] ?? false
        );

        return redirect()->route('settings.index')->with('success', 'Setting berhasil diperbarui.');
    }

    public function destroy(Setting $setting, SystemSettingService $service): RedirectResponse
    {
        $setting->delete();
        $service->refresh();

        return redirect()->route('settings.index')->with('success', 'Setting berhasil dihapus.');
    }
}
