import { prisma } from "@/lib/prisma";
import { buildLocationTree, type LocationNode } from "@/lib/location-tree";

function subtreeFilter(nodes: LocationNode[], id: string) {
  const item = buildLocationTree(nodes).find((node) => node.id === id);
  return { in: item?.subtreeIds ?? [id] };
}

const NODE_SELECT = { id: true, code: true, name: true, parentId: true } as const;

/**
 * Asset filter for a chosen location that also matches its sub-locations, so filtering on
 * "Gudang Pusat" includes assets in "Gudang Pusat › Lantai 2". Empty id → no filter.
 */
export async function assetLocationFilter(locationId: string | null | undefined) {
  if (!locationId) return undefined;
  return subtreeFilter(await prisma.assetLocation.findMany({ select: NODE_SELECT }), locationId);
}

/** Same for departments: "Sekolah" also matches its sub-departments (Teacher, Kepala Sekolah, …). */
export async function departmentFilter(departmentId: string | null | undefined) {
  if (!departmentId) return undefined;
  return subtreeFilter(await prisma.department.findMany({ select: NODE_SELECT }), departmentId);
}
