"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { prisma } from "@/lib/prisma";

export type AssetPhotoActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNextPublicRoot() {
  return path.join(process.cwd(), "src", "public");
}

function getLegacyPublicRoot() {
  return path.join(process.cwd(), "public");
}

function getUploadDirectory(assetId: string) {
  return path.join(getNextPublicRoot(), "uploads", "assets", assetId);
}

function getPublicPhotoPath(assetId: string, filename: string) {
  return `/uploads/assets/${assetId}/${filename}`;
}

function getSafeAbsolutePublicPath(publicRoot: string, publicPath: string) {
  const absolutePath = path.normalize(path.join(publicRoot, publicPath.replace(/^\/+/, "")));

  if (!absolutePath.startsWith(publicRoot)) {
    return null;
  }

  return absolutePath;
}

function getExtension(filename: string) {
  const extension = path.extname(filename).replace(".", "").toLowerCase();

  return extension === "jpg" ? "jpeg" : extension;
}

async function assertAssetExists(assetId: string) {
  if (!assetId) {
    return false;
  }

  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return Boolean(asset);
}

function revalidateAssetPages(assetId: string) {
  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${assetId}`);
}

async function deletePhysicalPhoto(publicPath: string) {
  for (const publicRoot of [getNextPublicRoot(), getLegacyPublicRoot()]) {
    const absolutePath = getSafeAbsolutePublicPath(publicRoot, publicPath);

    if (!absolutePath) {
      continue;
    }

    try {
      await unlink(absolutePath);
    } catch {
      // File might already be missing; database state is the source of truth.
    }
  }
}

export async function uploadAssetPhotoAction(
  _state: AssetPhotoActionState,
  formData: FormData,
): Promise<AssetPhotoActionState> {
  const user = await requirePermission("assets.manage");

  const assetId = getString(formData, "assetId");
  const file = formData.get("photo");
  const errors: AssetPhotoActionState["errors"] = {};

  if (!(await assertAssetExists(assetId))) {
    errors.assetId = "Asset tidak ditemukan atau sudah dihapus.";
  }

  if (!(file instanceof File) || file.size === 0) {
    errors.photo = "Pilih file foto terlebih dahulu.";
  }

  if (file instanceof File && file.size > MAX_FILE_SIZE) {
    errors.photo = "Ukuran foto maksimal 5 MB.";
  }

  const extension = file instanceof File ? getExtension(file.name) : "";
  const storedExtension = extension === "jpeg" ? "jpg" : extension;

  if (file instanceof File && (!ALLOWED_EXTENSIONS.has(storedExtension) || !ALLOWED_MIME_TYPES.has(file.type))) {
    errors.photo = "Format foto harus jpg, jpeg, png, atau webp.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      message: "Upload foto gagal. Periksa kembali file yang dipilih.",
    };
  }

  const filename = `${Date.now()}-${randomUUID()}.${storedExtension}`;
  const uploadDirectory = getUploadDirectory(assetId);
  const relativePath = getPublicPhotoPath(assetId, filename);
  const absolutePath = path.join(uploadDirectory, filename);

  try {
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(absolutePath, Buffer.from(await (file as File).arrayBuffer()));

    await prisma.$transaction(async (tx) => {
      const hasPrimaryPhoto = await tx.assetPhoto.findFirst({
        where: {
          assetId,
          isPrimary: true,
        },
        select: { id: true },
      });

      const photo = await tx.assetPhoto.create({
        data: {
          assetId,
          isPrimary: !hasPrimaryPhoto,
          path: relativePath,
        },
      });

      await createAssetHistory({
        action: "PHOTO_UPLOADED",
        assetId,
        changedById: user.id,
        description: "Foto asset diupload.",
        payload: { photoId: photo.id, path: photo.path, isPrimary: photo.isPrimary },
        tx,
      });
    });

    revalidateAssetPages(assetId);

    return {
      ok: true,
      message: "Foto asset berhasil diupload.",
    };
  } catch {
    await deletePhysicalPhoto(relativePath);

    return {
      message: "Foto asset gagal diupload. Silakan coba lagi.",
    };
  }
}

export async function deleteAssetPhotoAction(
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
      isPrimary: true,
      path: true,
    },
  });

  if (!photo) {
    return {
      message: "Foto tidak ditemukan.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.assetPhoto.delete({
        where: { id: photo.id },
      });

      if (photo.isPrimary) {
        const nextPhoto = await tx.assetPhoto.findFirst({
          where: { assetId: photo.assetId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });

        if (nextPhoto) {
          await tx.assetPhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true },
          });
        }
      }

      await createAssetHistory({
        action: "PHOTO_DELETED",
        assetId: photo.assetId,
        changedById: user.id,
        description: "Foto asset dihapus.",
        payload: { photoId: photo.id, path: photo.path, wasPrimary: photo.isPrimary },
        tx,
      });
    });

    await deletePhysicalPhoto(photo.path);
    revalidateAssetPages(photo.assetId);

    return {
      ok: true,
      message: "Foto asset berhasil dihapus.",
    };
  } catch {
    return {
      message: "Foto asset gagal dihapus. Silakan coba lagi.",
    };
  }
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
