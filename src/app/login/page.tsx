import { Boxes } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(420px,44%)_1fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-semibold text-[var(--text)]">
            <Boxes className="h-4 w-4 text-[var(--primary)]" />
            Asset Management
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-[var(--text)]">Masuk ke Dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Kelola aset, maintenance, audit, dan laporan dalam satu sistem.
          </p>

          <LoginForm nextPath={nextPath} />
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-[#eef2f7] lg:block">
        <img
          src="/auth-asset-cover.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-black/45 px-8 py-7 text-white">
          <p className="text-2xl font-semibold">Sistem Manajemen Aset</p>
          <p className="mt-2 text-sm">QR aset, movement, disposal, maintenance, audit, dan laporan siap unduh.</p>
        </div>
      </section>
    </main>
  );
}
