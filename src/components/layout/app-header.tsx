"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Expand, LogOut, Menu, Search, UserCircle } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";
import { TopbarNotifications } from "@/components/layout/topbar-notifications";
import { Input } from "@/components/ui/input";
import type { CurrentUser } from "@/lib/auth";

const shortcuts = [{ href: "/dashboard/reports", label: "Reports", text: "ID" }];

/** Client-side mirror of hasPermission (lib/auth is server-only); only decides what to render. */
function can(user: CurrentUser, permission: string) {
  return user.roles.includes("super-admin") || user.permissions.includes(permission);
}

export function AppHeader({ user }: { user: CurrentUser }) {
  const router = useRouter();

  function handleSearch(formData: FormData) {
    const query = String(formData.get("q") ?? "").trim();
    router.push(query ? `/dashboard/assets?q=${encodeURIComponent(query)}` : "/dashboard/assets");
  }

  function toggleSidebar() {
    window.dispatchEvent(new Event("ams:toggle-sidebar"));
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-[var(--app-bg)] px-5 lg:px-7">
      <div className="flex items-center gap-4">
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#65738f] transition hover:bg-white"
          aria-label="Buka atau ciutkan navigasi"
          aria-controls="primary-sidebar"
          title="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <form action={handleSearch} className="relative hidden w-[360px] md:block">
          <Input name="q" placeholder="Search asset code/name/serial..." className="h-10 pr-11" />
          <button
            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text)] transition hover:bg-[var(--primary-soft)]"
            aria-label="Search assets"
            type="submit"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {shortcuts.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#6b7895] transition hover:text-[var(--primary)]"
            aria-label={action.label}
            title={action.label}
          >
            <span className="text-xs font-semibold">{action.text}</span>
          </Link>
        ))}
        <TopbarNotifications userId={user.id} canSeeMaintenance={can(user, "assets.view") || can(user, "maintenance.manage")} />
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#6b7895] transition hover:text-[var(--primary)]"
          aria-label="Fullscreen"
          title="Fullscreen"
          onClick={toggleFullscreen}
        >
          <Expand className="h-5 w-5" />
        </button>
        <Link
          href="/dashboard/security"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white"
          aria-label={user.name}
          title={`${user.name} (${user.email})`}
        >
          {user.name ? (
            <span className="text-sm font-semibold text-[var(--primary)]">{user.name.slice(0, 2).toUpperCase()}</span>
          ) : (
            <UserCircle className="h-7 w-7 text-[#c6c8d0]" />
          )}
        </Link>
        <form action={logoutAction}>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#6b7895] transition hover:text-[var(--danger)]"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
