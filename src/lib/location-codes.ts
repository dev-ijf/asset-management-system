import type { Prisma } from "@/generated/prisma/client";
import { isChildCodeOf, nextChildCode } from "@/lib/location-tree";

type Tx = Prisma.TransactionClient;

/** Next sub-location code under a parent, e.g. GDA-03 when GDA-01 and GDA-02 exist. */
export async function nextCodeUnder(tx: Tx, parentId: string) {
  const parent = await tx.assetLocation.findUniqueOrThrow({ where: { id: parentId }, select: { code: true } });
  const siblings = await tx.assetLocation.findMany({
    where: { code: { startsWith: `${parent.code}-` } },
    select: { code: true },
  });
  return nextChildCode(parent.code, siblings.map((sibling) => sibling.code));
}

/**
 * After a location's code changes, give every sub-location below it a code that starts with the new
 * one: GDA-01 under GDA becomes GDB-01 under GDB. Children without a matching code get the next number.
 */
export async function recodeChildren(tx: Tx, parentId: string, oldParentCode: string, newParentCode: string) {
  const children = await tx.assetLocation.findMany({
    where: { parentId },
    orderBy: { code: "asc" },
    select: { id: true, code: true },
  });

  // Children that already follow the old code keep their number, so rename them before numbering the rest.
  const ordered = [
    ...children.filter((child) => isChildCodeOf(child.code, oldParentCode)),
    ...children.filter((child) => !isChildCodeOf(child.code, oldParentCode)),
  ];

  for (const child of ordered) {
    const newCode = isChildCodeOf(child.code, oldParentCode)
      ? `${newParentCode}${child.code.slice(oldParentCode.length)}`
      : await nextCodeUnder(tx, parentId);
    if (newCode === child.code) continue;
    await tx.assetLocation.update({ where: { id: child.id }, data: { code: newCode } });
    await recodeChildren(tx, child.id, child.code, newCode);
  }
}
