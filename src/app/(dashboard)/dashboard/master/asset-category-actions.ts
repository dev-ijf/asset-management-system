"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AssetCategoryActionState = {
  ok?: boolean;
  message?: string;
  errors?: {
    code?: string;
    name?: string;
    parentId?: string;
    description?: string;
    form?: string;
  };
};

const ASSET_CATEGORIES_PATH = "/dashboard/master/asset-categories";

function readAssetCategoryForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    parentId: String(formData.get("parentId") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function validateAssetCategoryInput(input: ReturnType<typeof readAssetCategoryForm>, ignoreId?: string) {
  const errors: AssetCategoryActionState["errors"] = {};

  if (!input.code) {
    errors.code = "Code wajib diisi.";
  }

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  if (input.code) {
    const existing = await prisma.assetCategory.findUnique({
      where: { code: input.code },
      select: { id: true },
    });

    if (existing && existing.id !== ignoreId) {
      errors.code = "Code sudah digunakan.";
    }
  }

  if (input.parentId) {
    if (input.parentId === ignoreId) {
      errors.parentId = "Parent category tidak boleh memilih dirinya sendiri.";
    } else {
      const parent = await prisma.assetCategory.findUnique({
        where: { id: input.parentId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        errors.parentId = "Parent category tidak ditemukan.";
      }

      let currentParentId = parent?.parentId ?? null;

      while (ignoreId && currentParentId) {
        if (currentParentId === ignoreId) {
          errors.parentId = "Parent category tidak boleh berasal dari turunannya sendiri.";
          break;
        }

        const currentParent = await prisma.assetCategory.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        currentParentId = currentParent?.parentId ?? null;
      }
    }
  }

  return errors;
}

function hasErrors(errors: AssetCategoryActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createAssetCategoryAction(
  _previousState: AssetCategoryActionState,
  formData: FormData,
): Promise<AssetCategoryActionState> {
  await requirePermission("assets.manage");

  const input = readAssetCategoryForm(formData);
  const errors = await validateAssetCategoryInput(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetCategory.create({
      data: {
        code: input.code,
        name: input.name,
        parentId: input.parentId || null,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code sudah digunakan." } };
    }

    return { errors: { form: "Asset category gagal dibuat. Coba lagi." } };
  }

  revalidatePath(ASSET_CATEGORIES_PATH);

  return { ok: true, message: "Asset category berhasil ditambahkan." };
}

export async function updateAssetCategoryAction(
  _previousState: AssetCategoryActionState,
  formData: FormData,
): Promise<AssetCategoryActionState> {
  await requirePermission("assets.manage");

  const input = readAssetCategoryForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset category tidak valid." } };
  }

  const errors = await validateAssetCategoryInput(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetCategory.update({
      where: { id: input.id },
      data: {
        code: input.code,
        name: input.name,
        parentId: input.parentId || null,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code sudah digunakan." } };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset category tidak ditemukan." } };
    }

    return { errors: { form: "Asset category gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(ASSET_CATEGORIES_PATH);

  return { ok: true, message: "Asset category berhasil diperbarui." };
}

export async function deleteAssetCategoryAction(
  _previousState: AssetCategoryActionState,
  formData: FormData,
): Promise<AssetCategoryActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset category tidak valid." } };
  }

  const usedByAssets = await prisma.asset.count({
    where: { assetCategoryId: id },
  });

  if (usedByAssets > 0) {
    return {
      errors: {
        form: `Asset category tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.`,
      },
    };
  }

  const usedByChildren = await prisma.assetCategory.count({
    where: { parentId: id },
  });

  if (usedByChildren > 0) {
    return {
      errors: {
        form: `Asset category tidak bisa dihapus karena masih memiliki ${usedByChildren} child category.`,
      },
    };
  }

  try {
    await prisma.assetCategory.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset category tidak ditemukan." } };
    }

    return { errors: { form: "Asset category gagal dihapus. Coba lagi." } };
  }

  revalidatePath(ASSET_CATEGORIES_PATH);

  return { ok: true, message: "Asset category berhasil dihapus." };
}
