"use server";

import { requestPasswordReset } from "@/lib/password-reset";

export type ForgotPasswordState = {
  error?: string;
  sent?: boolean;
  email?: string;
};

export async function forgotPasswordAction(_previousState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Email wajib diisi.", email };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid.", email };
  }

  try {
    await requestPasswordReset(email);
  } catch (error) {
    console.error("Password reset request failed", error);
    return { error: "Email reset password gagal dikirim. Coba lagi beberapa saat lagi atau hubungi administrator.", email };
  }

  // Same response whether or not the email is registered, so accounts cannot be enumerated.
  return { sent: true, email };
}
