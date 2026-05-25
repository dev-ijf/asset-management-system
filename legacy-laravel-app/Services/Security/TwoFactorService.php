<?php

namespace App\Services\Security;

use App\Models\User;
use Illuminate\Support\Str;

class TwoFactorService
{
    public function generateSecret(int $length = 20): string
    {
        return $this->base32Encode(random_bytes($length));
    }

    public function generateRecoveryCodes(int $count = 8): array
    {
        return collect(range(1, $count))
            ->map(fn () => Str::upper(Str::random(10)))
            ->toArray();
    }

    public function buildOtpAuthUrl(User $user, string $secret, string $issuer = 'AssetManagement'): string
    {
        $label = rawurlencode("{$issuer}:{$user->email}");
        $issuerEnc = rawurlencode($issuer);

        return "otpauth://totp/{$label}?secret={$secret}&issuer={$issuerEnc}";
    }

    public function verifyCode(string $secret, string $code, int $window = 1): bool
    {
        $code = trim($code);
        if (!ctype_digit($code)) {
            return false;
        }

        $timestamp = floor(time() / 30);
        for ($i = -$window; $i <= $window; $i++) {
            if ($this->totp($secret, $timestamp + $i) === $code) {
                return true;
            }
        }

        return false;
    }

    private function totp(string $secret, int $timestamp): string
    {
        $key = $this->base32Decode($secret);
        $binaryTime = pack('N*', 0) . pack('N*', $timestamp);
        $hash = hash_hmac('sha1', $binaryTime, $key, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $truncatedHash = substr($hash, $offset, 4);
        $value = unpack('N', $truncatedHash)[1] & 0x7FFFFFFF;
        $modulo = 10 ** 6;

        return str_pad((string) ($value % $modulo), 6, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $binary = '';
        foreach (str_split($data) as $char) {
            $binary .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }

        $fiveBitChunks = str_split($binary, 5);
        $encoded = '';
        foreach ($fiveBitChunks as $chunk) {
            if (strlen($chunk) < 5) {
                $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            }
            $encoded .= $alphabet[bindec($chunk)];
        }

        return $encoded;
    }

    private function base32Decode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $data = strtoupper($data);
        $binary = '';
        foreach (str_split($data) as $char) {
            $pos = strpos($alphabet, $char);
            if ($pos === false) {
                continue;
            }
            $binary .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $eightBitChunks = str_split($binary, 8);
        $decoded = '';
        foreach ($eightBitChunks as $chunk) {
            if (strlen($chunk) === 8) {
                $decoded .= chr(bindec($chunk));
            }
        }

        return $decoded;
    }
}
