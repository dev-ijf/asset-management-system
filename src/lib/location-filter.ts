import { prisma } from "@/lib/prisma";
import { buildLocationTree } from "@/lib/location-tree";

/**
 * Asset filter for a chosen location that also matches its sub-locations, so filtering on
 * "Gudang Pusat" includes assets in "Gudang Pusat › Lantai 2". Empty id → no filter.
 */
export async function assetLocationFilter(locationId: string | null | undefined) {
  if (!locationId) return undefined;
  const locations = await prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } });
  const item = buildLocationTree(locations).find((location) => location.id === locationId);
  return { in: item?.subtreeIds ?? [locationId] };
}
