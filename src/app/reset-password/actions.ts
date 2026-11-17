"use server";

import { redirect } from "next/navigation";
import { validateNewPassword } from "@/lib/password-policy";
import { resetPasswordWithToken } from "@/lib/password-reset";

export type ResetPasswordState = {
  error?: string;
};

export async function resetPasswordAction(_previousState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");

  const validationError = validateNewPassword(password, confirmation);

  if (validationError) {
    return { error: validationError };
  }

  const updated = await resetPasswordWithToken(token, password);

  if (!updated) {
    redirect("/forgot-password?expired=1");
  }

  redirect("/login?reset=success");
}
