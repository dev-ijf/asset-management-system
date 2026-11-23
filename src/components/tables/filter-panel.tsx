"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * Shared filter section for table pages: a search row that is always visible and, when the page has
 * filters, a collapsible panel with them. Put it inside the page's GET <form>. The panel starts open
 * while a filter is active; hidden fields still submit, so collapsing never drops an active filter.
 */
export function FilterPanel({
  searchName = "q",
  searchValue,
  searchPlaceholder,
  activeCount = 0,
  resetHref,
  children,
}: {
  /** Omit `searchPlaceholder` for pages without a text search. */
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  activeCount?: number;
  /** Link that clears the filters (shown while one is active). */
  resetHref?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(activeCount > 0);
  const hasFilters = Boolean(children);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        {searchPlaceholder ? (
          <div className="relative flex-1">
            <Input name={searchName} placeholder={searchPlaceholder} defaultValue={searchValue} className="h-10 pr-10" />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex gap-2">
          {searchPlaceholder ? (
            <Button type="submit" variant="secondary" className="h-10">
              Cari
            </Button>
          ) : null}
          {hasFilters ? (
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {open ? "Sembunyikan filter" : "Tampilkan filter"}
              {activeCount > 0 ? (
                <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-semibold text-white">{activeCount}</span>
              ) : null}
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </Button>
          ) : null}
        </div>
      </div>
      {hasFilters ? (
        <div hidden={!open} className="rounded-md border border-[var(--border)] bg-[var(--table-head)] p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{children}</div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {activeCount > 0 && resetHref ? (
              <Link
                href={resetHref}
                className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]"
              >
                Hapus filter
              </Link>
            ) : null}
            <Button type="submit" className="h-10">
              Terapkan filter
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Label above a filter control, so the control never has to carry its own (truncated) caption. */
export function FilterField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <div className="mt-1 [&_input]:h-10 [&_input]:w-full [&_select]:h-10 [&_select]:w-full [&_select]:truncate [&_select]:pr-8">{children}</div>
    </label>
  );
}
