<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetClass;
use App\Models\AssetLocation;
use App\Models\AssetStatus;
use App\Models\Department;
use App\Models\PersonInCharge;
use App\Models\Setting;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warranty;
use App\Services\Asset\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;
use App\Models\Role; // pakai model lokal yang sudah memakai UUID dan accessor id->uuid

class SetupWizardController extends Controller
{
    private function dbReady(): bool
    {
        try {
            \DB::connection()->getPdo();
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function index(Request $request): View|RedirectResponse
    {
        if (!$this->dbReady()) {
            return view('setup.database');
        }
        $step = (int) $request->get('step', 1);

        return view('setup.wizard', [
            'step' => $step,
            'hasUser' => User::exists(),
            'hasSettings' => Setting::exists(),
            'hasMaster' => AssetStatus::exists() && AssetClass::exists() && AssetCategory::exists(),
            'hasAsset' => Asset::exists(),
            'settings' => Setting::orderBy('group')->orderBy('key')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (!$this->dbReady()) {
            return redirect()->route('setup.index')->withErrors(['db' => 'Database belum siap. Periksa konfigurasi DB & migrasi.']);
        }
        $step = (int) $request->input('step', 1);

        if ($step === 1) {
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'confirmed', 'min:8'],
            ]);
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);
            $role = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
            $user->assignRole($role);
            auth()->login($user);
            return redirect()->route('setup.index', ['step' => 2])->with('success', 'User admin dibuat.');
        }

        if ($step === 2) {
            $settings = Setting::all();
            $input = $request->input('settings', []);

            foreach ($settings as $setting) {
                $key = $setting->key;
                $raw = $input[$key] ?? null;
                $value = $raw;

                if ($setting->type === 'boolean') {
                    $value = filter_var($raw, FILTER_VALIDATE_BOOL);
                } elseif ($setting->type === 'integer') {
                    $value = is_null($raw) ? null : (int) $raw;
                } else {
                    $value = is_null($raw) ? null : (string) $raw;
                }

                $setting->update(['value' => $value]);
            }

            return redirect()->route('setup.index', ['step' => 3])->with('success', 'Setting dasar disimpan.');
        }

        if ($step === 3) {
            $status = AssetStatus::firstOrCreate(['code' => 'ACTIVE'], ['name' => 'Active']);
            AssetStatus::firstOrCreate(['code' => 'DISPOSED'], ['name' => 'Disposed']);
            $class = AssetClass::firstOrCreate(['code' => 'IT'], ['name' => 'Perangkat IT']);
            $category = AssetCategory::firstOrCreate(['code' => 'LAPTOP'], ['name' => 'Laptop']);
            $unit = Unit::firstOrCreate(['symbol' => 'pcs'], ['name' => 'Unit']);
            $dept = Department::firstOrCreate(['code' => 'GEN'], ['name' => 'General']);
            $pic = PersonInCharge::firstOrCreate(['email' => 'pic@example.com'], ['name' => 'Default PIC']);
            $loc = AssetLocation::firstOrCreate(['code' => 'WH'], ['name' => 'Warehouse']);
            $warranty = Warranty::firstOrCreate(['name' => '1 Tahun'], ['duration_months' => 12]);

            session()->flash('master_refs', compact('status','class','category','unit','dept','pic','loc','warranty'));

            return redirect()->route('setup.index', ['step' => 4])->with('success', 'Master data dasar dibuat.');
        }

        if ($step === 4) {
            $service = app(AssetService::class);
            $refs = session('master_refs', []);
            $asset = $service->create([
                'name' => $request->input('asset_name', 'Sample Asset'),
                'asset_status_id' => $refs['status']->id ?? AssetStatus::first()->id ?? null,
                'asset_class_id' => $refs['class']->id ?? AssetClass::first()->id ?? null,
                'asset_category_id' => $refs['category']->id ?? AssetCategory::first()->id ?? null,
                'unit_id' => $refs['unit']->id ?? Unit::first()->id ?? null,
                'department_id' => $refs['dept']->id ?? Department::first()->id ?? null,
                'person_in_charge_id' => $refs['pic']->id ?? PersonInCharge::first()->id ?? null,
                'asset_user_id' => null,
                'asset_location_id' => $refs['loc']->id ?? AssetLocation::first()->id ?? null,
                'warranty_id' => $refs['warranty']->id ?? null,
                'purchase_date' => now()->subMonth(),
                'cost' => 15000000,
                'depreciation_method' => 'straight_line',
                'useful_life_months' => 36,
                'residual_value' => 2000000,
            ]);

            return redirect()->route('index')->with('success', "Setup selesai. Aset sample {$asset->code} dibuat.");
        }

        return back()->with('error', 'Langkah tidak dikenal.');
    }

    public function migrate(Request $request): RedirectResponse
    {
        $withSample = $request->boolean('with_sample');
        try {
            Artisan::call('migrate', ['--force' => true]);
            if ($withSample) {
                Artisan::call('db:seed', ['--force' => true]);
            } else {
                // Seed minimal: RBAC + default settings agar wizard punya baseline konfigurasi
                Artisan::call('db:seed', ['--force' => true, '--class' => 'Database\\Seeders\\RbacSeeder']);
                Artisan::call('db:seed', ['--force' => true, '--class' => 'Database\\Seeders\\SettingSeeder']);
            }
            return redirect()->route('setup.index', ['step' => 1])->with('success', 'Migrasi berhasil' . ($withSample ? ' dengan sample data.' : '.'));
        } catch (\Throwable $e) {
            return redirect()->route('setup.index')->withErrors(['db' => 'Migrasi gagal: '.$e->getMessage()]);
        }
    }
}
