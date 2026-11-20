/** Trims a name and collapses inner whitespace, so "Elektronik " and "Elektronik  Rumah" compare cleanly. */
export function readName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

/**
 * Prisma `where` for another record with the same name, ignoring letter case.
 * Pass the record's own id on edit so it does not match itself.
 */
export function sameNameWhere(name: string, ignoreId?: string) {
  return {
    name: { equals: name, mode: "insensitive" as const },
    ...(ignoreId ? { id: { not: ignoreId } } : {}),
  };
}

/** e.g. "Nama ini sudah dipakai Asset class ELEC. Gunakan data yang sudah ada atau beri nama lain." */
export function duplicateNameMessage(label: string, existingCode?: string | null, scope?: string) {
  return `Nama ini sudah dipakai ${label}${existingCode ? ` ${existingCode}` : ""}${scope ? ` ${scope}` : ""}. Gunakan data yang sudah ada atau beri nama lain.`;
}
