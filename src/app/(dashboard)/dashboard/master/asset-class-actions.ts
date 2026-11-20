"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";
import { duplicateNameMessage, readName, sameNameWhere } from "@/lib/master-validation";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";

type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const PATH = "/dashboard/master/asset-classes";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: readName(formData.get("name")),
    description: String(formData.get("description") ?? "").trim(),
  };
}

/** Short readable codes such as TNH, GDB, PRM: letters, digits, "-" and "_". */
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

async function validate(input: ReturnType<typeof readForm>, ignoreId?: string) {
  const errors: ActionState["errors"] = {};

  if (!input.code) {
    errors.code = "Code wajib diisi.";
  } else if (!CODE_PATTERN.test(input.code)) {
    errors.code = "Code hanya boleh huruf, angka, tanda - atau _, tanpa spasi. Contoh: PRM.";
  }

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  checkLengths(errors, [
    ["code", "Code", input.code, TEXT_LIMITS.code],
    ["name", "Name", input.name, TEXT_LIMITS.name],
    ["description", "Description", input.description, TEXT_LIMITS.description],
  ]);

  if (input.code && !errors.code) {
    const existing = await prisma.assetClass.findUnique({ where: { code: input.code }, select: { id: true } });
    if (existing && existing.id !== ignoreId) errors.code = "Code sudah digunakan class lain.";
  }

  if (input.name && !errors.name) {
    const existing = await prisma.assetClass.findFirst({ where: sameNameWhere(input.name, ignoreId), select: { code: true } });
    if (existing) errors.name = duplicateNameMessage("asset class", existing.code);
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createAssetClassAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = await validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetClass.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code sudah digunakan class lain." } };
    }

    return { errors: { form: "Asset class gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Asset class berhasil ditambahkan." };
}

export async function updateAssetClassAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset class tidak valid." } };
  }

  const errors = await validate(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetClass.update({
      where: { id: input.id },
      data: {
        code: input.code,
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { code: "Code sudah digunakan class lain." } };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset class tidak ditemukan." } };
    }

    return { errors: { form: "Asset class gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Asset class berhasil diperbarui." };
}

export async function deleteAssetClassAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset class tidak valid." } };
  }

  const inUse = await masterInUseMessage("Asset class", { assetClassId: id });

  if (inUse) {
    return { errors: { form: inUse } };
  }

  const categories = await prisma.assetCategory.count({ where: { assetClassId: id } });
  if (categories > 0) {
    return { errors: { form: `Asset class tidak bisa dihapus karena masih dipasangkan ke ${categories} kategori. Ganti class di Master Kategori terlebih dahulu.` } };
  }

  try {
    await prisma.assetClass.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset class tidak ditemukan." } };
    }

    return { errors: { form: "Asset class gagal dihapus. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Asset class berhasil dihapus." };
}
