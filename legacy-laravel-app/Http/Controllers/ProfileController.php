<?php

namespace App\Http\Controllers;

use App\Models\AssetLocation;
use App\Models\Department;
use App\Services\Security\TwoFactorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactor)
    {
    }

    public function show(Request $request): View
    {
        $user = $request->user();

        return view('profile.index', [
            'user' => $user,
            'departments' => Department::orderBy('name')->get(),
            'locations' => AssetLocation::orderBy('name')->get(),
            'otpUrl' => $user->two_factor_secret ? $this->twoFactor->buildOtpAuthUrl($user, $user->two_factor_secret) : null,
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'asset_location_id' => ['nullable', 'uuid', 'exists:asset_locations,id'],
        ]);

        $user->update($data);

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return back()->with('success', 'Kata sandi berhasil diperbarui.');
    }

    public function setup2fa(Request $request): RedirectResponse
    {
        $user = $request->user();

        $secret = $this->twoFactor->generateSecret();
        $recovery = $this->twoFactor->generateRecoveryCodes();

        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => $recovery,
            'two_factor_enabled' => false,
            'two_factor_confirmed_at' => null,
        ]);

        return back()->with('success', '2FA disiapkan. Silakan konfirmasi kode.')->with('show2fa', true);
    }

    public function confirm2fa(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        if (!$user->two_factor_secret || !$this->twoFactor->verifyCode($user->two_factor_secret, $data['code'])) {
            return back()->withErrors(['code' => 'Kode 2FA tidak valid.']);
        }

        $user->update([
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        return back()->with('success', '2FA berhasil diaktifkan.');
    }

    public function disable2fa(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        return back()->with('success', '2FA dinonaktifkan.');
    }
}
