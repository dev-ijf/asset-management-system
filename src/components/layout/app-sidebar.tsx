"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileBarChart,
  Gauge,
  Home,
  Package,
  Repeat2,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { SidebarItem } from "@/types/navigation";

const navigation: SidebarItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Assets", href: "/dashboard/assets", icon: Package, permission: "assets.view" },
  {
    title: "Master Data",
    href: "/dashboard/master",
    icon: Boxes,
    permission: "assets.manage",
    children: [
      { title: "Asset Statuses", href: "/dashboard/master/asset-statuses" },
      { title: "Asset Classes", href: "/dashboard/master/asset-classes" },
      { title: "Units", href: "/dashboard/master/units" },
      { title: "Departments", href: "/dashboard/master/departments" },
      { title: "Person in Charge", href: "/dashboard/master/person-in-charge" },
      { title: "Asset Users", href: "/dashboard/master/asset-users" },
      { title: "Asset Categories", href: "/dashboard/master/asset-categories" },
      { title: "Asset Locations", href: "/dashboard/master/asset-locations" },
      { title: "Warranties", href: "/dashboard/master/warranties" },
    ],
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: Repeat2,
    permission: "movements.manage",
    children: [
      { title: "Movements", href: "/dashboard/transactions/movements", permission: "movements.manage" },
      { title: "Disposals", href: "/dashboard/transactions/disposals", permission: "disposals.manage" },
      { title: "Audits", href: "/dashboard/transactions/audits", permission: "audits.manage" },
    ],
  },
  { title: "Maintenance", href: "/dashboard/maintenance", icon: Wrench, permission: "maintenance.manage" },
  { title: "Reports", href: "/dashboard/reports", icon: FileBarChart, permission: "reports.view" },
];

const utilityItems = [
  { label: "Charts", href: "/dashboard/charts", icon: BarChart3 },
  { label: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck },
  { label: "Security", href: "/dashboard/security", icon: ShieldCheck },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
  { label: "Archive", href: "/dashboard/archive", icon: Trash2 },
];

function isActive(pathname: string, item: SidebarItem) {
  if (item.href === "/dashboard") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const activeGroup = navigation.find((item) => item.children && isActive(pathname, item));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex bg-white">
      <div className="flex w-[72px] flex-col items-center border-r border-[var(--border)] bg-white py-4">
        <Link href="/dashboard" className="mb-7 flex h-10 w-10 items-center justify-center rounded-md text-[var(--text)]">
          <Gauge className="h-6 w-6" />
          <span className="sr-only">Asset Management</span>
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);

            return (
              <Link
                key={item.title}
                href={item.children?.[0]?.href ?? item.href}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-md text-[#71819d] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]",
                  active && "bg-[var(--primary-soft)] text-[var(--primary)]",
                )}
                title={item.title}
              >
                {Icon ? <Icon className="h-5 w-5" /> : null}
                <span className="sr-only">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3 border-t border-[var(--border)] pt-4">
          {utilityItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md text-[#71819d] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]",
                  active && "bg-[var(--primary-soft)] text-[var(--primary)]",
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
          <div className="mt-2 h-11 w-11 rounded-full bg-[#d6d6dc]" />
        </div>
      </div>

      <div className="dashboard-sidebar-secondary hidden w-[270px] border-r border-[var(--border)] bg-white px-3 py-7 lg:block">
        {activeGroup ? (
          <>
            <p className="mb-5 px-3 text-base font-medium text-black">{activeGroup.title}</p>
            <nav className="space-y-2">
              {activeGroup.children?.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-5 py-3 text-sm text-[var(--text)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]",
                      active && "bg-[var(--primary)] text-white hover:bg-[var(--primary)] hover:text-white",
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </>
        ) : (
          <>
            <p className="mb-5 px-3 text-base font-medium text-black">Dashboards</p>
            <Link
              href="/dashboard"
              className="block rounded-md bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white"
            >
              Summary
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
