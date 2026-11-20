import type { Prisma } from "@/generated/prisma/client";
import { isChildCodeOf, nextChildCode } from "@/lib/location-tree";

type Tx = Prisma.TransactionClient;

/**
 * Locations and departments share one coding rule: a top-level record has a typed code (GDA, SKL) and
 * each child gets "<parent code>-NN" (GDA-01, SKL-02). This is the storage each model plugs in.
 */
export type HierarchyCodeStore = {
  codeOf(id: string): Promise<string>;
  codesWithPrefix(prefix: string): Promise<string[]>;
  children(parentId: string): Promise<{ id: string; code: string }[]>;
  setCode(id: string, code: string): Promise<void>;
};

export function locationCodeStore(tx: Tx): HierarchyCodeStore {
  return {
    codeOf: async (id) => (await tx.assetLocation.findUniqueOrThrow({ where: { id }, select: { code: true } })).code,
    codesWithPrefix: async (prefix) =>
      (await tx.assetLocation.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } })).map((row) => row.code),
    children: (parentId) => tx.assetLocation.findMany({ where: { parentId }, orderBy: { code: "asc" }, select: { id: true, code: true } }),
    setCode: async (id, code) => {
      await tx.assetLocation.update({ where: { id }, data: { code } });
    },
  };
}

export function departmentCodeStore(tx: Tx): HierarchyCodeStore {
  return {
    codeOf: async (id) => (await tx.department.findUniqueOrThrow({ where: { id }, select: { code: true } })).code,
    codesWithPrefix: async (prefix) =>
      (await tx.department.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } })).map((row) => row.code),
    children: (parentId) => tx.department.findMany({ where: { parentId }, orderBy: { code: "asc" }, select: { id: true, code: true } }),
    setCode: async (id, code) => {
      await tx.department.update({ where: { id }, data: { code } });
    },
  };
}

/** Next child code under a parent, e.g. GDA-03 when GDA-01 and GDA-02 exist. */
export async function nextCodeUnder(store: HierarchyCodeStore, parentId: string) {
  const parentCode = await store.codeOf(parentId);
  return nextChildCode(parentCode, await store.codesWithPrefix(`${parentCode}-`));
}

/**
 * After a record's code changes, give every child below it a code that starts with the new one:
 * GDA-01 under GDA becomes GDB-01 under GDB. Children without a matching code get the next number.
 */
export async function recodeChildren(store: HierarchyCodeStore, parentId: string, oldParentCode: string, newParentCode: string) {
  const children = await store.children(parentId);
  // Children that already follow the old code keep their number, so rename them before numbering the rest.
  const ordered = [
    ...children.filter((child) => isChildCodeOf(child.code, oldParentCode)),
    ...children.filter((child) => !isChildCodeOf(child.code, oldParentCode)),
  ];

  for (const child of ordered) {
    const newCode = isChildCodeOf(child.code, oldParentCode)
      ? `${newParentCode}${child.code.slice(oldParentCode.length)}`
      : await nextCodeUnder(store, parentId);
    if (newCode === child.code) continue;
    await store.setCode(child.id, newCode);
    await recodeChildren(store, child.id, child.code, newCode);
  }
}
