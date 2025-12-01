<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\System\SystemSettingService;
use Illuminate\View\View;

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
}
