import { wibMidnight } from "@/lib/datetime";

/**
 * "Dari" / "Sampai" date filters shared by the report, approval and archive pages and their exports.
 * Safe to import from client components (no server-only dependencies).
 */

export const DATE_RANGE_ERROR =
  'Tanggal "Dari" tidak boleh lebih besar dari tanggal "Sampai". Perbaiki rentang tanggal lalu filter ulang.';

const DAY_MS = 86_400_000;

/** Parses a YYYY-MM-DD input value to 00:00 UTC of that day; null when empty or not a real date. */
export function parseDay(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export type DateRangeFilter = { gte?: Date; lt?: Date };

/**
 * Inclusive WIB day range: from 00:00 WIB of `from` until the end of `to` in WIB, so from = to returns that whole day.
 * Date-only columns are stored as 00:00 UTC of their day, which falls inside the same WIB day.
 * Returns `error` instead of a filter when from is after to, so callers can tell the user
 * instead of silently returning nothing.
 */
export function parseDateRange(from?: string | null, to?: string | null): { filter?: DateRangeFilter; error?: string } {
  const start = parseDay(from);
  const end = parseDay(to);

  if (start && end && start > end) return { error: DATE_RANGE_ERROR };
  if (!start && !end) return {};

  return {
    filter: {
      ...(start ? { gte: wibMidnight(from!) } : {}),
      ...(end ? { lt: new Date(wibMidnight(to!).getTime() + DAY_MS) } : {}),
    },
  };
}

/** Response for export routes called with a reversed range. */
export function dateRangeErrorResponse() {
  return new Response(DATE_RANGE_ERROR, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
