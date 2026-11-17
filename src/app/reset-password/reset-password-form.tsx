"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction, type ResetPasswordState } from "@/app/reset-password/actions";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPassword ? "text" : "password";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.error ? <AuthAlert tone="error">{state.error}</AuthAlert> : null}

      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Password baru</span>
        <div className="relative mt-2">
          <Input
            name="password"
            type={inputType}
            autoComplete="new-password"
            placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            className="pl-11 pr-11"
            required
          />
          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--muted)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Konfirmasi password baru</span>
        <div className="relative mt-2">
          <Input
            name="password_confirmation"
            type={inputType}
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            className="pl-11"
            required
          />
          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        </div>
      </label>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Menyimpan..." : "Simpan password baru"}
      </Button>
    </form>
  );
}
