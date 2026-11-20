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

const PATH = "/dashboard/master/units";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: readName(formData.get("name")),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function generateSymbol() {
  const rows = await prisma.unit.findMany({
    where: { symbol: { startsWith: "UNT-" } },
    select: { symbol: true },
  });

  return getNextSequentialCode(rows.map((row) => row.symbol), "UNT");
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
    const existing = await prisma.unit.findFirst({ where: sameNameWhere(input.name, ignoreId), select: { symbol: true } });
    if (existing) errors.name = duplicateNameMessage("unit", existing.symbol);
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createUnitAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = await validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.unit.create({
      data: {
        symbol: await generateSymbol(),
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { form: "Symbol unit otomatis sudah digunakan. Coba simpan ulang." } };
    }

    return { errors: { form: "Unit gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Unit berhasil ditambahkan." };
}

export async function updateUnitAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);

  if (!input.id) {
    return { errors: { form: "Unit tidak valid." } };
  }

  const errors = await validate(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.unit.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Unit tidak ditemukan." } };
    }

    return { errors: { form: "Unit gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Unit berhasil diperbarui." };
}

export async function deleteUnitAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Unit tidak valid." } };
  }

  const inUse = await masterInUseMessage("Unit", { unitId: id });

  if (inUse) {
    return { errors: { form: inUse } };
  }

  try {
    await prisma.unit.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Unit tidak ditemukan." } };
    }

    return { errors: { form: "Unit gagal dihapus. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Unit berhasil dihapus." };
}
