"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { prisma } from "@/lib/prisma";

export type RestoreReply = { ok?: boolean; message?: string; error?: string };

export async function restoreAssetsAction(ids: string[]): Promise<RestoreReply> {
  const user = await requirePermission("assets.manage");
  const uniqueIds = [...new Set(ids)].slice(0, 200);
  if (uniqueIds.length === 0) return { error: "Pilih minimal satu aset untuk dipulihkan." };

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const assets = await tx.asset.findMany({
        where: { id: { in: uniqueIds }, archivedAt: { not: null }, deletedAt: null },
        select: { id: true, code: true, assetStatusId: true, assetClassId: true, assetCategoryId: true, assetLocationId: true, departmentId: true },
      });
      if (assets.length !== uniqueIds.length) throw new Error("INVALID_ARCHIVE_SELECTION");

      for (const asset of assets) {
        await tx.asset.update({
          where: { id: asset.id },
          data: { archivedAt: null, archivedById: null, archiveReason: null, restoredAt: new Date(), restoredById: user.id },
        });
        await createAssetHistory({
          action: "RESTORED",
          assetId: asset.id,
          changedById: user.id,
          description: `Asset ${asset.code} dipulihkan dari arsip.`,
          payload: { restoredAt: new Date().toISOString() },
          tx,
        });
      }
      return assets.length;
    });

    revalidatePath("/dashboard/archive");
    revalidatePath("/dashboard/assets");
    for (const id of uniqueIds) revalidatePath(`/dashboard/assets/${id}`);
    return { ok: true, message: restored === 1 ? "Aset berhasil dipulihkan." : `${restored} aset berhasil dipulihkan.` };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ARCHIVE_SELECTION") {
      return { error: "Sebagian aset tidak ditemukan, sudah dipulihkan, atau sudah dihapus." };
    }
    return { error: "Aset gagal dipulihkan. Coba lagi." };
  }
}
