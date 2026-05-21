import type { ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { CurrentUser } from "@/lib/auth";

type DashboardShellProps = {
  children: ReactNode;
  user: CurrentUser;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <AppSidebar />
      <div className="dashboard-content min-h-screen pl-[72px] lg:pl-[342px]">
        <AppHeader user={user} />
        <main className="px-5 pb-10 lg:px-7">
          <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm shadow-slate-200/20">
            {children}
          </div>
        </main>
        <footer className="px-5 pb-5 text-center text-sm text-[var(--muted)]">
          Copyright 2026 Vyzor. Designed with care by Spruko All rights reserved
        </footer>
      </div>
      <button
        className="fixed bottom-5 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-md bg-[var(--primary)] text-white shadow-lg"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
