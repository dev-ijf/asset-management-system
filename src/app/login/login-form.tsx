"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm({ nextPath, googleError }: { nextPath: string; googleError?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {state.error || googleError ? (
        <div role="alert" className="rounded-md border border-[rgba(255,91,82,0.35)] bg-[#ffecea] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {state.error || googleError}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Email</span>
        <div className="relative mt-2">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.email}
            className="pl-11"
            required
          />
          <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Password</span>
        <div className="relative mt-2">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
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

      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="inline-flex items-center gap-2 text-[var(--text)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
            disabled
          />
          Ingat saya
        </label>
        <span className="text-[var(--primary)]">Lupa password?</span>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Memproses..." : "Masuk"}
      </Button>
      <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span>atau</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <a href="/api/auth/google" className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-[var(--text)] transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">
        <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" />
          <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
        </svg>
        Sign in with Google
      </a>
    </form>
  );
}
