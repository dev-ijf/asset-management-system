import { prisma } from "@/lib/prisma";
import { categoryClassResolver } from "@/lib/category-class";
import type { PaginationQuery } from "@/lib/pagination";

/**
 * Column filters of the master data tables. Each table filters on its own columns (Name, parent,
 * class, department, …); the page reads them from the search params.
 */
export type MasterParams = PaginationQuery & Record<string, string | undefined>;

/** How many of the given filter keys carry a value (for the "Tampilkan filter (n)" badge). */
export function activeFilterCount(params: MasterParams, keys: string[]) {
  return keys.filter((key) => params[key]).length;
}

/** Categories whose effective class (own or inherited from the parent) is `classId`. */
export async function categoryIdsOfClass(classId: string) {
  const categories = await prisma.assetCategory.findMany({ select: { id: true, parentId: true, assetClassId: true } });
  const classOf = categoryClassResolver(categories);
  return categories.filter((category) => classOf(category.id) === classId).map((category) => category.id);
}
