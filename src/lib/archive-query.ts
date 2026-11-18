import type { Prisma } from "@/generated/prisma/client";
import { parseDateRange } from "@/lib/date-range";

export type ArchiveView = "archived" | "deleted";

type Params = { get(key: string): string | null | undefined };

const DAY_MS = 86_400_000;

export function archiveView(value: string | null | undefined): ArchiveView {
  return value === "deleted" ? "deleted" : "archived";
}

/**
 * Builds the Archive filter shared by the page and the CSV export.
 * "archived" = archived but not deleted; "deleted" = soft-deleted (archived or not).
 */
export function buildArchiveQuery(params: Params, now = new Date()) {
  const read = (key: string) => (params.get(key) ?? "").trim();
  const view = archiveView(read("view"));
  const q = read("q");
  const age = read("age");
  const from = read("from");
  const to = read("to");
  const sort = read("sort");
  const direction: Prisma.SortOrder = read("direction") === "asc" ? "asc" : "desc";

  // From/to and the age preset are separate conditions, so using both narrows the result to their overlap.
  const dates = parseDateRange(from, to);
  const range: Prisma.DateTimeFilter = {};
  const ago = (days: number) => new Date(now.getTime() - days * DAY_MS);
  if (age === "30") range.gte = ago(30);
  if (age === "90") Object.assign(range, { gte: ago(90), lt: ago(30) });
  if (age === "180") Object.assign(range, { gte: ago(180), lt: ago(90) });
  if (age === "365") Object.assign(range, { gte: ago(365), lt: ago(180) });
  if (age === "older") range.lt = ago(365);

  const dateField = view === "deleted" ? "deletedAt" : "archivedAt";
  const where: Prisma.AssetWhereInput = {
    ...(view === "deleted"
      ? { deletedAt: { not: null, ...range } }
      : { deletedAt: null, archivedAt: { not: null, ...range } }),
    ...(dates.filter ? { AND: [view === "deleted" ? { deletedAt: dates.filter } : { archivedAt: dates.filter }] } : {}),
    // A reversed range matches nothing; the page shows dateError instead.
    ...(dates.error ? { id: { in: [] } } : {}),
    assetCategoryId: read("category") || undefined,
    assetLocationId: read("location") || undefined,
    departmentId: read("department") || undefined,
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
            { archiveReason: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.AssetOrderByWithRelationInput =
    sort === "code" ? { code: direction } : sort === "name" ? { name: direction } : { [dateField]: direction };

  return { view, where, orderBy, dateError: dates.error, values: { q, age, from, to, sort: sort || "date", direction } };
}
