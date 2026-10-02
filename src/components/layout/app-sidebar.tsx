"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Boxes,
  ClipboardCheck,
  FileBarChart,
  Gauge,
  Home,
  Package,
  Repeat2,
  ShieldCheck,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
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
  { title: "Reports", href: "/dashboard/reports", icon: FileBarChart, permission: "reports.view", children: [
    { title: "Reports", href: "/dashboard/reports", icon: FileBarChart, permission: "reports.view" },
    { title: "Charts", href: "/dashboard/charts", icon: BarChart3 },
  ] },
];

const utilityItems = [
  { label: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck },
  { label: "Security", href: "/dashboard/security", icon: ShieldCheck },
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeGroup = navigation.find(item => item.children &&
    (isActive(pathname, item) || item.children.some(child => isActive(pathname, child))));
  const [selection, setSelection] = useState<{ pathname: string; group: string | null } | null>(null);
  const openGroup = selection?.pathname === pathname ? selection.group : activeGroup?.href;

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("asset-management-sidebar-collapsed") === "true"); }
    catch { /* Storage can be blocked. */ }
  }, []);

  useEffect(() => {
    const toggle = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCollapsed(previous => {
          const next = !previous;
          try { localStorage.setItem("asset-management-sidebar-collapsed", String(next)); }
          catch { /* Navigation still works without storage. */ }
          return next;
        });
      } else setMobileOpen(previous => !previous);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeMobile = () => setMobileOpen(false);
    desktop.addEventListener("change", closeMobile);
    window.addEventListener("ams:toggle-sidebar", toggle);
    return () => {
      desktop.removeEventListener("change", closeMobile);
      window.removeEventListener("ams:toggle-sidebar", toggle);
    };
  }, []);

  const toggleSidebar = () => window.dispatchEvent(new Event("ams:toggle-sidebar"));
  const linkClass = (active: boolean) => cn(
    "primary-sidebar-link flex h-12 shrink-0 items-center rounded-md text-[#71819d] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]",
    active && "bg-[var(--primary-soft)] text-[var(--primary)]",
  );

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)}
        className="fixed inset-0 z-30 bg-black/20 lg:hidden" /> : null}
      <aside aria-label="Sidebar" onKeyDown={event => { if (event.key === "Escape") setMobileOpen(false); }}
        className="fixed inset-y-0 left-0 z-40 flex bg-white">
        <div id="primary-sidebar" data-collapsed={collapsed} data-mobile-open={mobileOpen}
          className="dashboard-sidebar-primary flex shrink-0 flex-col items-center overflow-y-auto border-r border-[var(--border)] bg-white py-4">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}
            aria-label="Asset Management System" title="Asset Management System"
            className="mb-4 flex w-[calc(100%-24px)] shrink-0 flex-col items-center overflow-hidden rounded-md py-2 text-center text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]">
            <Gauge aria-hidden="true" className="h-6 w-6 shrink-0" />
            <span aria-hidden="true" className="primary-sidebar-label sidebar-brand-label">
              <span className="mt-2 block text-base font-semibold leading-6">Asset Management</span>
              <span className="block text-base font-semibold leading-6">System</span>
            </span>
          </Link>
          <button type="button" onClick={toggleSidebar} aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            aria-expanded={!collapsed} aria-controls="primary-navigation" title={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            className="mb-4 hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#71819d] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] lg:inline-flex">
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <nav id="primary-navigation" aria-label="Navigasi utama" className="flex w-full flex-1 flex-col items-center gap-3">
            {navigation.map(item => {
              const Icon = item.icon;
              const active = isActive(pathname, item) || Boolean(item.children?.some(child => isActive(pathname, child)));
              const open = openGroup === item.href;
              const submenuId = `submenu-${item.title.toLowerCase().replaceAll(" ", "-")}`;
              const content = <><span className="primary-sidebar-icon">{Icon ? <Icon className="h-5 w-5" /> : null}</span><span className="primary-sidebar-label">{item.title}</span></>;
              return item.children ? (
                <div key={item.href} className="w-full shrink-0">
                  <Link href={item.children[0].href} onClick={() => setMobileOpen(false)} aria-label={item.title} title={item.title}
                    className={cn(linkClass(active), "sidebar-compact-group mx-auto")}>
                    {content}
                  </Link>
                  <button type="button" className={cn(linkClass(active), "sidebar-group-button mx-auto text-left")}
                    aria-expanded={open} aria-controls={submenuId}
                    onClick={() => setSelection({ pathname, group: open ? null : item.href })}>
                    {content}<ChevronRight aria-hidden="true" className={cn("ml-auto mr-2 h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-90")} />
                  </button>
                  <div id={submenuId} className="sidebar-submenu" data-open={open} inert={!open} aria-hidden={!open}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="mx-3 mt-2 space-y-1 border-l border-[var(--border)] pl-3">
                        {item.children.map(child => {
                          const selected = isActive(pathname, child);
                          const ChildIcon = child.icon;
                          return <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)}
                            aria-current={selected ? "page" : undefined}
                            className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]",
                              selected && "bg-[var(--primary)] text-white hover:bg-[var(--primary)] hover:text-white")}>
                            {ChildIcon ? <ChildIcon className="h-4 w-4 shrink-0" /> : null}{child.title}
                          </Link>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={linkClass(active)}
                aria-label={item.title} title={item.title} aria-current={active ? "page" : undefined}>{content}</Link>;
            })}
          </nav>
          <div className="mt-4 flex w-full shrink-0 flex-col items-center gap-3 border-t border-[var(--border)] pt-4">
            {utilityItems.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={linkClass(active)}
                aria-label={item.label} title={item.label} aria-current={active ? "page" : undefined}>
                <span className="primary-sidebar-icon"><Icon className="h-5 w-5" /></span><span className="primary-sidebar-label">{item.label}</span>
              </Link>;
            })}
            <div className="mt-2 h-11 w-11 rounded-full bg-[#d6d6dc]" />
          </div>
        </div>
      </aside>
    </>
  );
}
