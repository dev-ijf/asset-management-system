"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";
import { duplicateNameMessage, readName, sameNameWhere } from "@/lib/master-validation";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";
import { syncAssetClassesForCategory } from "@/lib/category-class";

export type AssetCategoryActionState = {
  ok?: boolean;
  message?: string;
  errors?: {
    code?: string;
    name?: string;
    parentId?: string;
    assetClassId?: string;
    description?: string;
    form?: string;
  };
};

const ASSET_CATEGORIES_PATH = "/dashboard/master/asset-categories";

function readAssetCategoryForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: readName(formData.get("name")),
    parentId: String(formData.get("parentId") ?? "").trim(),
    assetClassId: String(formData.get("assetClassId") ?? "").trim(),
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

  checkLengths(errors, [
    ["code", "Code", input.code, TEXT_LIMITS.code],
    ["name", "Name", input.name, TEXT_LIMITS.name],
    ["description", "Description", input.description, TEXT_LIMITS.description],
  ]);

  if (input.name && !errors.name) {
    const existing = await prisma.assetCategory.findFirst({
      where: { ...sameNameWhere(input.name, ignoreId), parentId: input.parentId || null },
      select: { code: true },
    });
    if (existing) errors.name = duplicateNameMessage("asset category", existing.code, "di parent yang sama");
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

  if (input.assetClassId && !(await prisma.assetClass.findUnique({ where: { id: input.assetClassId }, select: { id: true } }))) {
    errors.assetClassId = "Class tidak ditemukan.";
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

/** Class is stored on top-level categories only; a sub-category inherits it from its parent. */
function classOf(input: ReturnType<typeof readAssetCategoryForm>) {
  return input.parentId ? null : input.assetClassId || null;
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
        assetClassId: classOf(input),
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
  const user = await requirePermission("assets.manage");

  const input = readAssetCategoryForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset category tidak valid." } };
  }

  const errors = await validateAssetCategoryInput(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  let synced = 0;
  try {
    synced = await prisma.$transaction(async (tx) => {
      await tx.assetCategory.update({
        where: { id: input.id },
        data: {
          code: input.code,
          name: input.name,
          parentId: input.parentId || null,
          assetClassId: classOf(input),
          description: input.description || null,
        },
      });
      // A new class or a new parent changes the class this category's assets must have.
      return syncAssetClassesForCategory(tx, input.id, user.id);
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
  if (synced > 0) revalidatePath("/dashboard/assets");

  return {
    ok: true,
    message: synced > 0
      ? `Asset category berhasil diperbarui. Class ${synced} aset ikut disesuaikan dan tercatat di riwayat aset.`
      : "Asset category berhasil diperbarui.",
  };
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

  const inUse = await masterInUseMessage("Asset category", { assetCategoryId: id });

  if (inUse) {
    return { errors: { form: inUse } };
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
