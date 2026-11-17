"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { SYSTEM_STATUS_CODES } from "@/lib/asset-disposal";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";

export type AssetStatusActionState = {
  ok?: boolean;
  message?: string;
  errors?: {
    code?: string;
    name?: string;
    description?: string;
    form?: string;
  };
};

const ASSET_STATUSES_PATH = "/dashboard/master/asset-statuses";

function readAssetStatusForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function validateAssetStatusInput(input: ReturnType<typeof readAssetStatusForm>, ignoreId?: string) {
  const errors: AssetStatusActionState["errors"] = {};

  if (!input.code) {
    errors.code = "Code wajib diisi.";
  }

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  if (input.code) {
    const existing = await prisma.assetStatus.findUnique({
      where: { code: input.code },
      select: { id: true },
    });

    if (existing && existing.id !== ignoreId) {
      errors.code = "Code sudah digunakan.";
    }
  }

  return errors;
}

function hasErrors(errors: AssetStatusActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createAssetStatusAction(
  _previousState: AssetStatusActionState,
  formData: FormData,
): Promise<AssetStatusActionState> {
  await requirePermission("assets.manage");

  const input = readAssetStatusForm(formData);
  const errors = await validateAssetStatusInput(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetStatus.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code sudah digunakan." } };
    }

    return { errors: { form: "Asset status gagal dibuat. Coba lagi." } };
  }

  revalidatePath(ASSET_STATUSES_PATH);

  return { ok: true, message: "Asset status berhasil ditambahkan." };
}

function isSystemStatus(code: string) {
  return (SYSTEM_STATUS_CODES as readonly string[]).includes(code);
}

export async function updateAssetStatusAction(
  _previousState: AssetStatusActionState,
  formData: FormData,
): Promise<AssetStatusActionState> {
  await requirePermission("assets.manage");

  const input = readAssetStatusForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset status tidak valid." } };
  }

  const errors = await validateAssetStatusInput(input, input.id);

  const current = await prisma.assetStatus.findUnique({ where: { id: input.id }, select: { code: true } });
  if (current && isSystemStatus(current.code) && input.code !== current.code) {
    errors.code = `Code ${current.code} dipakai sistem (alur disposal) dan tidak bisa diubah.`;
  }

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetStatus.update({
      where: { id: input.id },
      data: {
        code: input.code,
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code sudah digunakan." } };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset status tidak ditemukan." } };
    }

    return { errors: { form: "Asset status gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(ASSET_STATUSES_PATH);

  return { ok: true, message: "Asset status berhasil diperbarui." };
}

export async function deleteAssetStatusAction(
  _previousState: AssetStatusActionState,
  formData: FormData,
): Promise<AssetStatusActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset status tidak valid." } };
  }

  const status = await prisma.assetStatus.findUnique({ where: { id }, select: { code: true } });
  if (status && isSystemStatus(status.code)) {
    return { errors: { form: `Status ${status.code} dipakai sistem (alur disposal) dan tidak bisa dihapus.` } };
  }

  const inUse = await masterInUseMessage("Asset status", { assetStatusId: id });

  if (inUse) {
    return { errors: { form: inUse } };
  }

  try {
    await prisma.assetStatus.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset status tidak ditemukan." } };
    }

    return { errors: { form: "Asset status gagal dihapus. Coba lagi." } };
  }

  revalidatePath(ASSET_STATUSES_PATH);

  return { ok: true, message: "Asset status berhasil dihapus." };
}
