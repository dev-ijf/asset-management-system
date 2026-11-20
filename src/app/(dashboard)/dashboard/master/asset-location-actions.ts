"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";
import { duplicateNameMessage, readName, sameNameWhere } from "@/lib/master-validation";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";
import { isChildCodeOf, LOCATION_CODE_PATTERN } from "@/lib/location-tree";
import { nextCodeUnder, recodeChildren } from "@/lib/location-codes";

export type AssetLocationActionState = {
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

const ASSET_LOCATIONS_PATH = "/dashboard/master/asset-locations";
const CODE_TAKEN = "Code sudah digunakan lokasi lain.";

function readAssetLocationForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: readName(formData.get("name")),
    parentId: String(formData.get("parentId") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function validateAssetLocationInput(input: ReturnType<typeof readAssetLocationForm>, ignoreId?: string) {
  const errors: AssetLocationActionState["errors"] = {};

  // Only parent (top-level) locations take a typed code; sub-locations get one from their parent.
  if (!input.parentId) {
    if (!input.code) {
      errors.code = "Code wajib diisi untuk parent location.";
    } else if (!LOCATION_CODE_PATTERN.test(input.code)) {
      errors.code = "Code hanya boleh huruf, angka, tanda - atau _, tanpa spasi. Contoh: GDA.";
    }
  }

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  checkLengths(errors, [
    ["code", "Code", input.parentId ? "" : input.code, TEXT_LIMITS.code],
    ["name", "Name", input.name, TEXT_LIMITS.name],
    ["description", "Description", input.description, TEXT_LIMITS.description],
  ]);

  if (!input.parentId && input.code && !errors.code) {
    const existing = await prisma.assetLocation.findUnique({ where: { code: input.code }, select: { id: true } });
    if (existing && existing.id !== ignoreId) errors.code = CODE_TAKEN;
  }

  if (input.name && !errors.name) {
    const existing = await prisma.assetLocation.findFirst({
      where: { ...sameNameWhere(input.name, ignoreId), parentId: input.parentId || null },
      select: { code: true },
    });
    if (existing) errors.name = duplicateNameMessage("location", existing.code, "di parent yang sama");
  }

  if (input.parentId) {
    if (input.parentId === ignoreId) {
      errors.parentId = "Parent location tidak boleh memilih dirinya sendiri.";
    } else {
      const parent = await prisma.assetLocation.findUnique({
        where: { id: input.parentId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        errors.parentId = "Parent location tidak ditemukan.";
      }

      let currentParentId = parent?.parentId ?? null;

      while (ignoreId && currentParentId) {
        if (currentParentId === ignoreId) {
          errors.parentId = "Parent location tidak boleh berasal dari turunannya sendiri.";
          break;
        }

        const currentParent = await prisma.assetLocation.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        currentParentId = currentParent?.parentId ?? null;
      }
    }
  }

  return errors;
}

function hasErrors(errors: AssetLocationActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

function isCodeConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createAssetLocationAction(
  _previousState: AssetLocationActionState,
  formData: FormData,
): Promise<AssetLocationActionState> {
  await requirePermission("assets.manage");

  const input = readAssetLocationForm(formData);
  const errors = await validateAssetLocationInput(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  let code = input.code;
  try {
    await prisma.$transaction(async (tx) => {
      if (input.parentId) code = await nextCodeUnder(tx, input.parentId);
      await tx.assetLocation.create({
        data: {
          code,
          name: input.name,
          parentId: input.parentId || null,
          description: input.description || null,
        },
      });
    });
  } catch (error) {
    if (isCodeConflict(error)) {
      return input.parentId
        ? { errors: { form: "Code sub-lokasi bentrok dengan penyimpanan lain. Coba simpan ulang." } }
        : { errors: { code: CODE_TAKEN } };
    }

    return { errors: { form: "Asset location gagal dibuat. Coba lagi." } };
  }

  revalidatePath(ASSET_LOCATIONS_PATH);

  return { ok: true, message: `Asset location ${code} berhasil ditambahkan.` };
}

export async function updateAssetLocationAction(
  _previousState: AssetLocationActionState,
  formData: FormData,
): Promise<AssetLocationActionState> {
  await requirePermission("assets.manage");

  const input = readAssetLocationForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset location tidak valid." } };
  }

  const errors = await validateAssetLocationInput(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  let code = input.code;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.assetLocation.findUniqueOrThrow({ where: { id: input.id }, select: { code: true, parentId: true } });

      if (input.parentId) {
        // Keep the current number while it already follows the parent (GDA-03 stays GDA-03).
        const parent = await tx.assetLocation.findUniqueOrThrow({ where: { id: input.parentId }, select: { code: true } });
        code = isChildCodeOf(existing.code, parent.code) ? existing.code : await nextCodeUnder(tx, input.parentId);
      }

      await tx.assetLocation.update({
        where: { id: input.id },
        data: {
          code,
          name: input.name,
          parentId: input.parentId || null,
          description: input.description || null,
        },
      });

      if (code !== existing.code) await recodeChildren(tx, input.id, existing.code, code);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset location tidak ditemukan." } };
    }

    if (isCodeConflict(error)) {
      return input.parentId
        ? { errors: { form: "Code sub-lokasi bentrok dengan lokasi lain. Coba simpan ulang." } }
        : { errors: { code: "Code ini (atau code sub-lokasi turunannya) sudah dipakai lokasi lain." } };
    }

    return { errors: { form: "Asset location gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(ASSET_LOCATIONS_PATH);

  return { ok: true, message: `Asset location ${code} berhasil diperbarui.` };
}

export async function deleteAssetLocationAction(
  _previousState: AssetLocationActionState,
  formData: FormData,
): Promise<AssetLocationActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset location tidak valid." } };
  }

  const inUse = await masterInUseMessage("Asset location", { assetLocationId: id });

  if (inUse) {
    return { errors: { form: inUse } };
  }

  const usedByChildren = await prisma.assetLocation.count({
    where: { parentId: id },
  });

  if (usedByChildren > 0) {
    return {
      errors: {
        form: `Asset location tidak bisa dihapus karena masih memiliki ${usedByChildren} sub-lokasi.`,
      },
    };
  }

  try {
    await prisma.assetLocation.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset location tidak ditemukan." } };
    }

    return { errors: { form: "Asset location gagal dihapus. Coba lagi." } };
  }

  revalidatePath(ASSET_LOCATIONS_PATH);

  return { ok: true, message: "Asset location berhasil dihapus." };
}
