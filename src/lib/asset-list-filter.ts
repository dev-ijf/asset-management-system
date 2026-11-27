import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { assetLocationFilter, departmentFilter } from "@/lib/location-filter";

/** Search and filters of the Data Asset list, as carried in its URL. */
export type AssetListFilters = {
  query: string;
  statusId: string;
  classId: string;
  categoryId: string;
  locationId: string;
  departmentId: string;
};

export function readAssetListFilters(params: Record<string, string | string[] | undefined>): AssetListFilters {
  const get = (key: string) => {
    const value = params[key];
    return String((Array.isArray(value) ? value[0] : value) ?? "").trim();
  };
  return {
    query: get("q"),
    statusId: get("status"),
    classId: get("class"),
    categoryId: get("category"),
    locationId: get("location"),
    departmentId: get("department"),
  };
}

/** The URL query for these filters (empty ones left out), e.g. for export or QR print links. */
export function assetListFilterQuery(filters: AssetListFilters) {
  return new URLSearchParams(
    Object.entries({
      q: filters.query,
      status: filters.statusId,
      class: filters.classId,
      category: filters.categoryId,
      location: filters.locationId,
      department: filters.departmentId,
    }).filter(([, value]) => value),
  );
}

/** Active (not deleted, not archived) assets matching the Data Asset search and filters. */
export async function assetListWhere(filters: AssetListFilters): Promise<Prisma.AssetWhereInput> {
  const { query, statusId, classId, categoryId, locationId, departmentId } = filters;
  return {
    deletedAt: null,
    archivedAt: null,
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { serialNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(statusId ? { assetStatusId: statusId } : {}),
    ...(classId ? { assetClassId: classId } : {}),
    ...(categoryId ? { assetCategoryId: categoryId } : {}),
    ...(locationId ? { assetLocationId: await assetLocationFilter(locationId) } : {}),
    ...(departmentId ? { departmentId: await departmentFilter(departmentId) } : {}),
  };
}
