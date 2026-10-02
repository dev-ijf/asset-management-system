"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { prisma } from "@/lib/prisma";
import { optionalPhoto, PhotoError } from "@/lib/asset-image";
import { prepareAssetPhoto, attachAssetPhoto, discardPreparedPhoto, removePhotoRecord, ensurePrimaryPhoto,
  cleanupPhotosSafely, deleteLegacyPhoto, type PreparedPhoto } from "@/lib/asset-photo-storage";

export type AssetPhotoActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function revalidateAssetPages(assetId: string) {
  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${assetId}`);
}

export async function uploadAssetPhotoAction(_state: AssetPhotoActionState, formData: FormData): Promise<AssetPhotoActionState> {
  const user = await requirePermission("assets.manage");
  const assetId = getString(formData, "assetId");
  let photo: PreparedPhoto | undefined;
  try {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, deletedAt: null }, select: { code: true } });
    if (!asset) return { message: "Asset tidak ditemukan atau sudah dihapus." };
    const file = optionalPhoto(formData);
    if (!file) return { errors: { photo: "Pilih foto terlebih dahulu." }, message: "Pilih foto terlebih dahulu." };
    photo = await prepareAssetPhoto(file, asset.code);
    const prepared = photo;
    await prisma.$transaction(async tx => {
      await tx.asset.update({ where: { id: assetId, deletedAt: null }, data: { updatedAt: new Date() } });
      const primary = await tx.assetPhoto.findFirst({ where: { assetId, isPrimary: true } });
      await attachAssetPhoto(tx, assetId, prepared, !primary);
      await createAssetHistory({ action: "PHOTO_UPLOADED", assetId, changedById: user.id,
        description: "Foto asset diupload ke storage privat.", payload: { photoId: prepared.id }, tx });
    });
  } catch (error) {
    await discardPreparedPhoto(photo);
    const message = error instanceof PhotoError ? error.message : "Foto gagal disimpan. Silakan coba lagi.";
    return { message, errors: { photo: message } };
  }
  await cleanupPhotosSafely();
  revalidateAssetPages(assetId);
  return { ok: true, message: "Foto berhasil diupload." };
}

export async function deleteAssetPhotoAction(_state: AssetPhotoActionState, formData: FormData): Promise<AssetPhotoActionState> {
  const user = await requirePermission("assets.manage");
  const photoId = getString(formData, "photoId");
  let removed;
  try {
    const photo = await prisma.assetPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return { message: "Foto tidak ditemukan." };
    removed = await prisma.$transaction(async tx => {
      await tx.asset.update({ where: { id: photo.assetId, deletedAt: null }, data: { updatedAt: new Date() } });
      const old = await removePhotoRecord(tx, photo.assetId, photo.id);
      await ensurePrimaryPhoto(tx, photo.assetId);
      await createAssetHistory({ action: "PHOTO_DELETED", assetId: photo.assetId, changedById: user.id,
        description: "Foto asset dihapus.", payload: { photoId }, tx });
      return old;
    });
  } catch { return { message: "Foto gagal dihapus. Silakan coba lagi." }; }
  await deleteLegacyPhoto(removed);
  const result = await cleanupPhotosSafely(removed.driveFileId ? [removed.driveFileId] : []);
  revalidateAssetPages(removed.assetId);
  return { ok: true, message: result.failed ? "Foto dihapus dari asset. Pembersihan Drive akan dicoba ulang." : "Foto berhasil dihapus." };
}

export async function setPrimaryAssetPhotoAction(
  _state: AssetPhotoActionState,
  formData: FormData,
): Promise<AssetPhotoActionState> {
  const user = await requirePermission("assets.manage");

  const photoId = getString(formData, "photoId");

  if (!photoId) {
    return {
      errors: { photoId: "Foto tidak valid." },
      message: "Foto tidak valid.",
    };
  }

  const photo = await prisma.assetPhoto.findUnique({
    where: { id: photoId },
    select: {
      assetId: true,
      id: true,
    },
  });

  if (!photo) {
    return {
      message: "Foto tidak ditemukan.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.asset.update({ where: { id: photo.assetId, deletedAt: null }, data: { updatedAt: new Date() } });
      await tx.assetPhoto.updateMany({
        where: { assetId: photo.assetId },
        data: { isPrimary: false },
      });
      await tx.assetPhoto.update({
        where: { id: photo.id },
        data: { isPrimary: true },
      });
      await createAssetHistory({
        action: "PRIMARY_PHOTO_CHANGED",
        assetId: photo.assetId,
        changedById: user.id,
        description: "Primary photo asset diperbarui.",
        payload: { photoId: photo.id },
        tx,
      });
    });

    revalidateAssetPages(photo.assetId);

    return {
      ok: true,
      message: "Primary photo berhasil diperbarui.",
    };
  } catch {
    return {
      message: "Primary photo gagal diperbarui. Silakan coba lagi.",
    };
  }
}
