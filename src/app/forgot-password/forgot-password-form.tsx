"use client";

import Link from "next/link";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction, type ForgotPasswordState } from "@/app/forgot-password/actions";
import { useFormAction } from "@/components/ui/use-form-action";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm({ notice }: { notice?: string }) {
  const [state, form, pending] = useFormAction(forgotPasswordAction, initialState);

  return (
    <form {...form} className="mt-8 space-y-5">
      {state.error ? (
        <AuthAlert tone="error">{state.error}</AuthAlert>
      ) : state.sent ? (
        <AuthAlert tone="success">
          Jika email tersebut terdaftar, tautan reset password sudah dikirim. Periksa kotak masuk atau folder spam Anda.
        </AuthAlert>
      ) : notice ? (
        <AuthAlert tone="error">{notice}</AuthAlert>
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

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Mengirim..." : "Kirim tautan reset"}
      </Button>

      <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
