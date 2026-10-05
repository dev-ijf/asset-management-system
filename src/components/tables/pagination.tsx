"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { PAGE_SIZE_OPTIONS, type PaginationMeta } from "@/lib/pagination";

type PaginationProps = PaginationMeta;

function pageItems(page: number, totalPages: number): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis-start" | "ellipsis-end"> = [];
  sorted.forEach((item, index) => {
    if (index > 0 && item - sorted[index - 1] > 1) result.push(index === 1 ? "ellipsis-start" : "ellipsis-end");
    result.push(item);
  });
  return result;
}

export function Pagination({ page, pageSize, total, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (total === 0) return null;

  const navigate = (nextPage: number, nextPageSize = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(nextPageSize));
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const buttonClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[var(--border)] px-3 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <nav aria-label="Pagination" aria-busy={isPending} className={`flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between ${isPending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
        <label className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => navigate(1, Number(event.target.value))}
            className="h-9 rounded-md border border-[var(--border)] bg-white px-2 text-[var(--text)]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <span>Showing {start}–{end} of {total}</span>
        {isPending ? <span className="text-xs">Memuat...</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className={buttonClass} disabled={page <= 1 || isPending} onClick={() => navigate(page - 1)} aria-label="Previous page">Previous</button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(page, totalPages).map((item) => typeof item === "number" ? (
            <button
              type="button"
              key={item}
              className={`${buttonClass} ${item === page ? "border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary)]" : ""}`}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              disabled={isPending}
              onClick={() => navigate(item)}
            >{item}</button>
          ) : <span key={item} className="px-1 text-[var(--muted)]">…</span>)}
        </div>
        <span className="px-2 text-sm sm:hidden">{page} / {totalPages}</span>
        <button type="button" className={buttonClass} disabled={page >= totalPages || isPending} onClick={() => navigate(page + 1)} aria-label="Next page">Next</button>
      </div>
    </nav>
  );
}
