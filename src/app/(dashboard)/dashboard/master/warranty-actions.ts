"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const PATH = "/dashboard/master/warranties";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    durationMonths: String(formData.get("durationMonths") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

function validate(input: ReturnType<typeof readForm>) {
  const errors: ActionState["errors"] = {};
  const durationMonths = Number(input.durationMonths);

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  if (!input.durationMonths || !Number.isInteger(durationMonths) || durationMonths < 1) {
    errors.durationMonths = "Duration months wajib berupa angka minimal 1.";
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createWarrantyAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.warranty.create({
      data: {
        name: input.name,
        durationMonths: Number(input.durationMonths),
        notes: input.notes || null,
      },
    });
  } catch {
    return { errors: { form: "Warranty gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Warranty berhasil ditambahkan." };
}

export async function updateWarrantyAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);

  if (!input.id) {
    return { errors: { form: "Warranty tidak valid." } };
  }

  const errors = validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.warranty.update({
      where: { id: input.id },
      data: {
        name: input.name,
        durationMonths: Number(input.durationMonths),
        notes: input.notes || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Warranty tidak ditemukan." } };
    }

    return { errors: { form: "Warranty gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Warranty berhasil diperbarui." };
}

export async function deleteWarrantyAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Warranty tidak valid." } };
  }

  const usedByAssets = await prisma.asset.count({ where: { warrantyId: id } });

  if (usedByAssets > 0) {
    return { errors: { form: `Warranty tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.` } };
  }

  try {
    await prisma.warranty.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Warranty tidak ditemukan." } };
    }

    return { errors: { form: "Warranty gagal dihapus. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Warranty berhasil dihapus." };
}
