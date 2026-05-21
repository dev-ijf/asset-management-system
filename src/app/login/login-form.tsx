"use client";

import { useActionState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {state.error ? (
        <div className="rounded-md border border-[rgba(255,91,82,0.35)] bg-[#ffecea] px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {state.error}
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
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className="pl-11"
            required
          />
          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
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
    </form>
  );
}
