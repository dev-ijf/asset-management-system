"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";
import { duplicateNameMessage, readName, sameNameWhere } from "@/lib/master-validation";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";
import { getNextSequentialCode } from "@/lib/sequential-code";

type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const PATH = "/dashboard/master/asset-classes";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: readName(formData.get("name")),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function generateCode() {
  const rows = await prisma.assetClass.findMany({
    where: { code: { startsWith: "CLS-" } },
    select: { code: true },
  });

  return getNextSequentialCode(rows.map((row) => row.code), "CLS");
}

async function validate(input: ReturnType<typeof readForm>, ignoreId?: string) {
  const errors: ActionState["errors"] = {};

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  checkLengths(errors, [
    ["name", "Name", input.name, TEXT_LIMITS.name],
    ["description", "Description", input.description, TEXT_LIMITS.description],
  ]);

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
        code: await generateCode(),
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { form: "Code kelas aset otomatis sudah digunakan. Coba simpan ulang." } };
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
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
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
