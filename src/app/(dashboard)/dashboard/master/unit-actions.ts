"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    name: String(formData.get("name") ?? "").trim(),
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

function validate(input: ReturnType<typeof readForm>) {
  const errors: ActionState["errors"] = {};

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createUnitAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = validate(input);

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

  const errors = validate(input);

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

  const usedByAssets = await prisma.asset.count({ where: { unitId: id } });

  if (usedByAssets > 0) {
    return { errors: { form: `Unit tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.` } };
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
