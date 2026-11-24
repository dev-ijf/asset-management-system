import "server-only";

import { buildLocationTree } from "@/lib/location-tree";
import { prisma } from "@/lib/prisma";

/** Permissions of the homeroom teacher role. */
export const CLASS_PERMISSIONS = {
  view: "class-assets.view",
  requestMaintenance: "maintenance.request",
  requestAsset: "asset-requests.create",
} as const;

export type ClassScope = {
  /** The class location linked to the user (Security › Users › Lokasi Kelas). */
  location: { id: string; name: string; path: string };
  /** The class location and all its sub-locations. */
  locationIds: string[];
};

/**
 * The class a user looks after: the location set on their account plus everything below it.
 * Null when no class location is set yet.
 */
export async function getClassScope(userId: string): Promise<ClassScope | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { assetLocationId: true } });
  if (!user?.assetLocationId) return null;

  const nodes = await prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } });
  const node = buildLocationTree(nodes).find((item) => item.id === user.assetLocationId);
  if (!node) return null;

  return { location: { id: node.id, name: node.name, path: node.path }, locationIds: node.subtreeIds };
}

/** Where-clause for live assets of the class. */
export function classAssetWhere(scope: ClassScope) {
  return { deletedAt: null, archivedAt: null, assetLocationId: { in: scope.locationIds } };
}
