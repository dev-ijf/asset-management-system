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
        ]);

        $remember = $request->boolean('remember');
        $authCredentials = Arr::only($credentials, ['email', 'password']);

        if (Auth::attempt($authCredentials, $remember)) {
            $user = Auth::user();
            if ($user->two_factor_enabled) {
                // logout and ask for 2FA challenge
                Auth::logout();
                $request->session()->put('2fa:user_id', $user->id);
                $request->session()->put('2fa:remember', $remember);
                return redirect()->route('twofactor.challenge');
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

    public function showTwoFactorChallenge(Request $request)
    {
        if (Auth::check()) {
            return redirect()->route('index');
        }
        if (!$request->session()->has('2fa:user_id')) {
            return redirect()->route('login');
        }
        return view('pages.authentication.two-factor-challenge');
    }

    public function verifyTwoFactorChallenge(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $userId = $request->session()->pull('2fa:user_id');
        $remember = $request->session()->pull('2fa:remember', false);

        if (!$userId) {
            return redirect()->route('login')->withErrors(['email' => 'Sesi 2FA tidak ditemukan, silakan login kembali.']);
        }

        $user = User::find($userId);
        if (!$user || !$user->two_factor_enabled || !$user->two_factor_secret) {
            return redirect()->route('login')->withErrors(['email' => 'Sesi 2FA tidak valid, silakan login kembali.']);
        }

        if (!$this->twoFactor->verifyCode($user->two_factor_secret, $data['code'])) {
            // keep session to retry
            $request->session()->put('2fa:user_id', $userId);
            $request->session()->put('2fa:remember', $remember);
            return back()->withErrors(['code' => 'Kode 2FA salah, coba lagi.']);
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(route('index'));
    }
}
