import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { googleErrors } from "@/lib/google-oauth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    google_error?: string;
    reset?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { next, google_error, reset } = await searchParams;
  const googleError = google_error && Object.hasOwn(googleErrors, google_error) ? googleErrors[google_error] : undefined;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const notice = reset === "success" ? "Password berhasil diubah. Silakan masuk dengan password baru." : undefined;

  return (
    <AuthShell title="Masuk ke Dashboard" description="Kelola aset, maintenance, audit, dan laporan dalam satu sistem.">
      <LoginForm nextPath={nextPath} googleError={googleError} notice={notice} />
    </AuthShell>
  );
}
