import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";
import { getCurrentUser } from "@/lib/auth";
import { PASSWORD_RESET_TTL_MINUTES } from "@/lib/password-reset";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ expired?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  const { expired } = await searchParams;
  const notice = expired ? "Tautan reset password tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru." : undefined;

  return (
    <AuthShell
      title="Lupa Password"
      description={`Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru, berlaku ${PASSWORD_RESET_TTL_MINUTES} menit.`}
    >
      <ForgotPasswordForm notice={notice} />
    </AuthShell>
  );
}
