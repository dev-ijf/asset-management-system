<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Security\TwoFactorService;
use Illuminate\Support\Arr;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Http\RedirectResponse;

class AuthController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactor)
    {
    }

    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('index');
        }
        return view('pages.authentication.sign-in-cover');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
            'code' => ['nullable', 'digits:6'],
        ]);

        $remember = $request->boolean('remember');
        $code = $credentials['code'] ?? null;
        $authCredentials = Arr::only($credentials, ['email', 'password']);

        if (Auth::attempt($authCredentials, $remember)) {
            $user = Auth::user();
            if ($user->two_factor_enabled) {
                if (!$code || !$this->twoFactor->verifyCode($user->two_factor_secret, $code)) {
                    Auth::logout();
                    return back()->withErrors(['code' => 'Kode 2FA tidak valid atau belum diisi.'])->withInput();
                }
            }
            $request->session()->regenerate();
            return redirect()->intended(route('index'));
        }

        return back()->withErrors(['email' => 'Email atau password salah.'])->withInput();
    }

    public function showRegister()
    {
        if (Auth::check()) {
            return redirect()->route('index');
        }
        return view('pages.authentication.sign-up-cover');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        Auth::login($user);

        return redirect()->route('index');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
