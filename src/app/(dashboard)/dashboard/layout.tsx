import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast-provider";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();

  return <ToastProvider><DashboardShell user={user}>{children}</DashboardShell></ToastProvider>;
}
