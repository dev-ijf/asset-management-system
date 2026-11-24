import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  /** Shown when the user has this permission, or any of these. */
  permission?: string | string[];
  children?: SidebarItem[];
};
