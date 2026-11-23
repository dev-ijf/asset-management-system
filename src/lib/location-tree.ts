/**
 * Locations form a tree (site → gedung → lantai → ruang). These helpers put them in tree order and
 * label each one with its full path, so every dropdown and table shows the same hierarchy.
 */
export type LocationNode = { id: string; code: string; name: string; parentId: string | null };

export type LocationTreeItem<T extends LocationNode> = T & {
  depth: number;
  /** "Gudang Pusat › Lantai 2" */
  path: string;
  /** Ids of this location and every location below it. */
  subtreeIds: string[];
};

export const LOCATION_PATH_SEPARATOR = " › ";

/** Depth-first order: each parent followed by its children (by code). Orphans/cycles end up as roots. */
export function buildLocationTree<T extends LocationNode>(locations: T[]): LocationTreeItem<T>[] {
  const byId = new Map(locations.map((location) => [location.id, location]));
  const children = new Map<string | null, T[]>();
  for (const location of locations) {
    const parentKey = location.parentId && byId.has(location.parentId) ? location.parentId : null;
    children.set(parentKey, [...(children.get(parentKey) ?? []), location]);
  }
  for (const list of children.values()) list.sort((a, b) => a.code.localeCompare(b.code));

  const result: LocationTreeItem<T>[] = [];
  const visited = new Set<string>();
  const visit = (location: T, depth: number, parentPath: string): string[] => {
    visited.add(location.id);
    const path = parentPath ? `${parentPath}${LOCATION_PATH_SEPARATOR}${location.name}` : location.name;
    const item = { ...location, depth, path, subtreeIds: [location.id] } as LocationTreeItem<T>;
    result.push(item);
    for (const child of children.get(location.id) ?? []) {
      if (!visited.has(child.id)) item.subtreeIds.push(...visit(child, depth + 1, path));
    }
    return item.subtreeIds;
  };
  for (const root of children.get(null) ?? []) visit(root, 0, "");
  // Anything left is part of a cycle; show it at the top level rather than hiding it.
  for (const location of locations) if (!visited.has(location.id)) visit(location, 0, "");
  return result;
}

/** Dropdown label: "WH-01 - Gudang Pusat › Lantai 2". */
export function locationOptionLabel(item: { code: string; path: string }) {
  return `${item.code} - ${item.path}`;
}

/** Tree-ordered `{ id, label }` options with full-path labels. */
export function locationOptions(locations: LocationNode[]) {
  return buildLocationTree(locations).map((item) => ({ id: item.id, label: locationOptionLabel(item) }));
}

/** Tree-ordered options labelled by path only (no code), e.g. "Gudang Pusat › Lantai 2". */
export function locationPathOptions(locations: LocationNode[]) {
  return buildLocationTree(locations).map((item) => ({ id: item.id, label: item.path }));
}

/** Parent (top-level) location codes are typed by the user, e.g. GDA, KMP1. */
export const LOCATION_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

function childCodePattern(parentCode: string) {
  const escaped = parentCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}-(\\d+)$`);
}

/** True when `code` is a direct child code of `parentCode`, e.g. GDA-01 under GDA. */
export function isChildCodeOf(code: string, parentCode: string) {
  return childCodePattern(parentCode).test(code);
}

/** Next free sub-location code under a parent: GDA → GDA-01, GDA-02, … */
export function nextChildCode(parentCode: string, existingCodes: Iterable<string>) {
  const pattern = childCodePattern(parentCode);
  let max = 0;
  for (const code of existingCodes) {
    const match = pattern.exec(code);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${parentCode}-${String(max + 1).padStart(2, "0")}`;
}
