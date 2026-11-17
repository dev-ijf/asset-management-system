import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Message explaining why a master record cannot be deleted, or null when no asset uses it.
 * Archived and soft-deleted assets still reference master data, so they are counted too,
 * and the message points to the Archive page where they can be restored or deleted permanently.
 */
export async function masterInUseMessage(label: string, where: Prisma.AssetWhereInput) {
  const [total, inArchive] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.count({ where: { AND: [where, { OR: [{ archivedAt: { not: null } }, { deletedAt: { not: null } }] }] } }),
  ]);

  if (total === 0) return null;

  const base = `${label} tidak bisa dihapus karena masih dipakai oleh ${total} aset`;
  if (inArchive === 0) return `${base}.`;
  if (inArchive === total) {
    return `${base} di halaman Archive (diarsipkan/dihapus). Hapus permanen aset tersebut dari Archive terlebih dahulu.`;
  }
  return `${base} (${total - inArchive} aktif, ${inArchive} di Archive). Ganti ${label.toLowerCase()} pada aset aktif, dan hapus permanen aset di Archive.`;
}
