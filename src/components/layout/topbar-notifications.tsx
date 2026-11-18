"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Wrench } from "lucide-react";
import type { NotificationItem, NotificationSummary } from "@/app/api/notifications/route";
import { wibFormat } from "@/lib/datetime";
import { REFRESH_NOTIFICATIONS_EVENT } from "@/lib/notification-events";


const POLL_MS = 60_000;
const iconButton =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#6b7895] transition hover:text-[var(--primary)]";

function badgeText(count: number) {
  return count > 99 ? "99+" : String(count);
}

/** Reads /api/notifications on mount, on navigation, when the tab regains focus, on demand and every minute. */
function useNotifications() {
  const pathname = usePathname();
  const [data, setData] = useState<NotificationSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (response.ok) setData((await response.json()) as NotificationSummary);
    } catch {
      // Keep the last known counts; the next poll retries.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const refresh = () => void load();
    const timer = window.setInterval(onVisible, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(REFRESH_NOTIFICATIONS_EVENT, refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(REFRESH_NOTIFICATIONS_EVENT, refresh);
    };
  }, [load]);

  return data;
}

function MaintenanceShortcut({ summary }: { summary: NotificationSummary["maintenance"] }) {
  // Before the first load the icon shows without a badge, so the topbar does not shift.
  const { open, overdue } = summary ?? { open: 0, overdue: 0 };
  const label = open
    ? `${open} maintenance belum selesai${overdue ? `, ${overdue} lewat jadwal` : ""}`
    : "Tidak ada maintenance yang belum selesai";

  return (
    <Link href="/dashboard/maintenance" className={iconButton} aria-label={label} title={label}>
      <Wrench className="h-5 w-5" />
      {open > 0 ? (
        <span
          className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold text-white ${
            overdue > 0 ? "bg-[var(--danger)]" : "bg-[var(--primary)]"
          }`}
        >
          {badgeText(open)}
        </span>
      ) : null}
    </Link>
  );
}

function ItemList({ items, empty }: { items: NotificationItem[]; empty: string }) {
  if (items.length === 0) return <p className="px-4 py-3 text-sm text-[var(--muted)]">{empty}</p>;

  const time = wibFormat({ day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const tone: Record<string, string> = {
    APPROVED: "bg-[var(--success,#16a34a)]",
    REJECTED: "bg-[var(--danger)]",
    PENDING: "bg-[var(--warning,#f59e0b)]",
  };

  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((item) => (
        <li key={item.id}>
          <Link href="/dashboard/approvals" className="flex gap-3 px-4 py-3 hover:bg-[var(--table-head)]">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone[item.status] ?? "bg-slate-400"}`} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-[var(--text)]">{item.title}</span>
              <span className="block truncate text-xs text-[var(--muted)]">{item.detail}</span>
              <span className="block text-xs text-[var(--muted)]">{time.format(new Date(item.at))}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NotificationBell({ data }: { data: NotificationSummary | null }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const pending = data?.approvals?.pending ?? 0;
  const label = pending ? `Notifikasi: ${pending} approval menunggu` : "Notifikasi";

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className={iconButton}
        aria-label={label}
        title={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {pending > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--pink)] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {badgeText(pending)}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-xl">
          {!data ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">Memuat notifikasi…</p>
          ) : (
            <>
              {data.approvals ? (
                <section>
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                    <h2 className="text-sm font-semibold text-[var(--text)]">Menunggu approval ({data.approvals.pending})</h2>
                    <Link href="/dashboard/approvals" className="text-xs font-medium text-[var(--primary)] hover:underline">
                      Lihat semua
                    </Link>
                  </div>
                  <ItemList items={data.approvals.items} empty="Tidak ada approval yang menunggu." />
                </section>
              ) : null}
              <section className={data.approvals ? "border-t border-[var(--border)]" : undefined}>
                <h2 className="border-b border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]">Request saya</h2>
                <ItemList items={data.mine} empty="Belum ada request dalam 7 hari terakhir." />
              </section>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Maintenance badge and notification bell of the topbar; both show only real, current counts. */
export function TopbarNotifications({ canSeeMaintenance }: { canSeeMaintenance: boolean }) {
  const data = useNotifications();

  return (
    <>
      {canSeeMaintenance ? <MaintenanceShortcut summary={data?.maintenance ?? null} /> : null}
      <NotificationBell data={data} />
    </>
  );
}
