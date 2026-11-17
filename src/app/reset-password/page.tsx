import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { findValidResetToken } from "@/lib/password-reset";

import type { Metadata } from "next";

// Keep the reset token in the URL from leaking through the Referer header.
export const metadata: Metadata = { referrer: "no-referrer" };

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  if (!(await findValidResetToken(token))) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <AuthShell title="Buat Password Baru" description="Masukkan password baru untuk akun Anda. Setelah disimpan, semua sesi lama akan keluar otomatis.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
