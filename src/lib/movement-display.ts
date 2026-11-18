/**
 * A movement stores a "to" value only for what it changed; null means the field kept its value.
 * Showing that null as "-" reads as if the field was cleared, so it is labelled explicitly.
 */

export const UNCHANGED_LABEL = "Tidak berubah";

type Named = { name: string } | null | undefined;

/** "Gudang A → Gudang B", or "Gudang A (tidak berubah)" when the movement did not touch this field. */
export function movementChangeText(from: Named, toId: string | null, to: Named) {
  const fromName = from?.name ?? "-";
  if (!toId) return `${fromName} (tidak berubah)`;
  return `${fromName} → ${to?.name ?? "-"}`;
}

/** Value of a "To ..." export column. */
export function movementToValue(toId: string | null, to: Named) {
  return toId ? to?.name ?? "" : UNCHANGED_LABEL;
}
