"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { cleanupPhotosSafely, deleteLegacyPhoto, queuePhotoDeletion } from "@/lib/asset-photo-storage";
import { prisma } from "@/lib/prisma";

export type RestoreReply = { ok?: boolean; message?: string; error?: string };

const MAX_SELECTION = 200;
const PERMANENT_DELETE_CONFIRMATION = "HAPUS";

/** Archived or soft-deleted: the only assets the Archive page may restore or delete permanently. */
const INACTIVE_ASSET = { OR: [{ archivedAt: { not: null } }, { deletedAt: { not: null } }] };

class ArchiveSelectionError extends Error {}

function uniqueSelection(ids: string[]) {
  return [...new Set(ids.filter((id) => typeof id === "string" && id))].slice(0, MAX_SELECTION);
}

function revalidateArchive(ids: string[]) {
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard");
  for (const id of ids) revalidatePath(`/dashboard/assets/${id}`);
}

/** Returns archived and soft-deleted assets to the active asset list. */
export async function restoreAssetsAction(ids: string[]): Promise<RestoreReply> {
  const user = await requirePermission("assets.manage");
  const uniqueIds = uniqueSelection(ids);
  if (uniqueIds.length === 0) return { error: "Pilih minimal satu aset untuk dipulihkan." };

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const assets = await tx.asset.findMany({
        where: { id: { in: uniqueIds }, ...INACTIVE_ASSET },
        select: { id: true, code: true, archivedAt: true, deletedAt: true },
      });
      if (assets.length !== uniqueIds.length) throw new ArchiveSelectionError();

      const restoredAt = new Date();
      for (const asset of assets) {
        // Guarded update: a concurrent restore makes this match 0 rows instead of restoring twice.
        const updated = await tx.asset.updateMany({
          where: { id: asset.id, ...INACTIVE_ASSET },
          data: { archivedAt: null, archivedById: null, archiveReason: null, deletedAt: null, restoredAt, restoredById: user.id },
        });
        if (updated.count !== 1) throw new ArchiveSelectionError();

        await createAssetHistory({
          action: "RESTORED",
          assetId: asset.id,
          changedById: user.id,
          description: asset.deletedAt
            ? `Asset ${asset.code} dipulihkan dari daftar aset terhapus.`
            : `Asset ${asset.code} dipulihkan dari arsip.`,
          payload: {
            restoredAt: restoredAt.toISOString(),
            fromArchivedAt: asset.archivedAt?.toISOString() ?? null,
            fromDeletedAt: asset.deletedAt?.toISOString() ?? null,
          },
          tx,
        });
      }
      return assets.length;
    });

    revalidateArchive(uniqueIds);
    return { ok: true, message: restored === 1 ? "Aset berhasil dipulihkan." : `${restored} aset berhasil dipulihkan.` };
  } catch (error) {
    if (error instanceof ArchiveSelectionError) {
      return { error: "Sebagian aset tidak ditemukan atau sudah dipulihkan. Muat ulang halaman." };
    }
    return { error: "Aset gagal dipulihkan. Coba lagi." };
  }
}

/**
 * Permanently removes archived or soft-deleted assets with their photos, history and transactions
 * (all child tables cascade). Active assets are never touched. Frees master data that only these assets used.
 */
export async function permanentDeleteAssetsAction(ids: string[], confirmation: string): Promise<RestoreReply> {
  const user = await requirePermission("assets.manage");
  const uniqueIds = uniqueSelection(ids);
  if (uniqueIds.length === 0) return { error: "Pilih minimal satu aset untuk dihapus permanen." };
  if (confirmation.trim().toUpperCase() !== PERMANENT_DELETE_CONFIRMATION) {
    return { error: `Ketik ${PERMANENT_DELETE_CONFIRMATION} untuk mengonfirmasi hapus permanen.` };
  }

  try {
    const { codes, photos } = await prisma.$transaction(async (tx) => {
      const assets = await tx.asset.findMany({
        where: { id: { in: uniqueIds }, ...INACTIVE_ASSET },
        select: {
          id: true,
          code: true,
          photos: { select: { path: true, driveFileId: true } },
          maintenancePhotos: { select: { driveFileId: true } },
        },
      });
      if (assets.length !== uniqueIds.length) throw new ArchiveSelectionError();

      // Maintenance photos go with the asset too; they carry no legacy path.
      const assetPhotos = assets.flatMap((asset) => [
        ...asset.photos,
        ...asset.maintenancePhotos.map((photo) => ({ path: "", driveFileId: photo.driveFileId })),
      ]);
      // Queue Drive files before the rows disappear, so a failed Drive call is retried later instead of leaking.
      for (const photo of assetPhotos) {
        if (photo.driveFileId) await queuePhotoDeletion(tx, photo.driveFileId);
      }

      // Re-check the inactive condition in the delete itself: an asset restored meanwhile is not deleted.
      const deleted = await tx.asset.deleteMany({ where: { id: { in: uniqueIds }, ...INACTIVE_ASSET } });
      if (deleted.count !== uniqueIds.length) throw new ArchiveSelectionError();

      return { codes: assets.map((asset) => asset.code), photos: assetPhotos };
    });

    // History rows are deleted with the asset, so keep an audit line in the server log.
    console.info(`[archive] User ${user.id} menghapus permanen ${codes.length} aset: ${codes.join(", ")}`);

    for (const photo of photos) await deleteLegacyPhoto(photo).catch(() => undefined);
    const driveFileIds = photos.flatMap((photo) => (photo.driveFileId ? [photo.driveFileId] : []));
    // cleanupDrivePhotos handles 10 files per call; anything that fails stays queued for retry.
    for (let index = 0; index < driveFileIds.length; index += 10) {
      await cleanupPhotosSafely(driveFileIds.slice(index, index + 10));
    }

    revalidateArchive(uniqueIds);
    revalidatePath("/dashboard/master", "layout");
    return { ok: true, message: codes.length === 1 ? "Aset berhasil dihapus permanen." : `${codes.length} aset berhasil dihapus permanen.` };
  } catch (error) {
    if (error instanceof ArchiveSelectionError) {
      return { error: "Sebagian aset tidak ditemukan, sudah dihapus, atau sudah dipulihkan. Muat ulang halaman." };
    }
    return { error: "Aset gagal dihapus permanen. Coba lagi." };
  }
}
