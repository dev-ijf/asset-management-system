import type { Prisma } from "@/generated/prisma/client";

/**
 * Asset class follows the asset category. The class is set on a top-level category only;
 * every sub-category (at any depth) inherits it. A category tree without a class leaves the
 * asset's class free to choose, so existing data keeps working until a class is assigned.
 */
export type CategoryNode = { id: string; parentId: string | null; assetClassId: string | null };

const MAX_DEPTH = 50;

/** Returns a function giving the class a category's assets must use, or null when it is free. */
export function categoryClassResolver(categories: CategoryNode[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return (categoryId: string | null | undefined): string | null => {
    let current = categoryId ? byId.get(categoryId) : undefined;
    for (let depth = 0; current && depth < MAX_DEPTH; depth += 1) {
      if (current.assetClassId) return current.assetClassId;
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return null;
  };
}

type CategoryReader = {
  assetCategory: {
    findMany(args: { select: { id: true; parentId: true; assetClassId: true } }): Promise<CategoryNode[]>;
  };
};

export async function loadCategoryClassResolver(db: CategoryReader) {
  return categoryClassResolver(await db.assetCategory.findMany({ select: { id: true, parentId: true, assetClassId: true } }));
}

/** The category and all of its descendants. */
export function categorySubtree(categories: CategoryNode[], rootId: string) {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return [...ids];
}

/**
 * After a category's class or parent changed, moves every asset in its subtree to the class the
 * category now dictates, and records the change in each asset's history. Returns how many assets moved.
 */
export async function syncAssetClassesForCategory(tx: Prisma.TransactionClient, categoryId: string, userId: string) {
  const categories = await tx.assetCategory.findMany({ select: { id: true, parentId: true, assetClassId: true } });
  const classId = categoryClassResolver(categories)(categoryId);
  if (!classId) return 0;

  const assets = await tx.asset.findMany({
    where: { assetCategoryId: { in: categorySubtree(categories, categoryId) }, NOT: { assetClassId: classId } },
    select: { id: true, assetClassId: true },
  });
  if (assets.length === 0) return 0;

  const assetClass = await tx.assetClass.findUnique({ where: { id: classId }, select: { code: true, name: true } });
  await tx.asset.updateMany({ where: { id: { in: assets.map((asset) => asset.id) } }, data: { assetClassId: classId } });
  await tx.assetHistory.createMany({
    data: assets.map((asset) => ({
      assetId: asset.id,
      action: "UPDATED",
      changedById: userId,
      description: `Class disesuaikan dengan kategori: ${assetClass ? `${assetClass.code} - ${assetClass.name}` : classId}.`,
      payload: { field: "assetClassId", from: asset.assetClassId, to: classId, reason: "category-class" },
    })),
  });
  return assets.length;
}
