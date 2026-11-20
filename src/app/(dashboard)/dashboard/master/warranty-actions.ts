"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";
import { duplicateNameMessage, readName, sameNameWhere } from "@/lib/master-validation";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";
import { recomputeWarrantyEndSql } from "@/lib/warranty";

type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const PATH = "/dashboard/master/warranties";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: readName(formData.get("name")),
    durationMonths: String(formData.get("durationMonths") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

async function validate(input: ReturnType<typeof readForm>, ignoreId?: string) {
  const errors: ActionState["errors"] = {};
  const durationMonths = Number(input.durationMonths);

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  checkLengths(errors, [
    ["name", "Name", input.name, TEXT_LIMITS.name],
    ["notes", "Notes", input.notes, TEXT_LIMITS.description],
  ]);

  if (input.name && !errors.name) {
    const existing = await prisma.warranty.findFirst({ where: sameNameWhere(input.name, ignoreId), select: { id: true } });
    if (existing) errors.name = duplicateNameMessage("warranty", null);
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
  const errors = await validate(input);

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

  const errors = await validate(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.warranty.update({
        where: { id: input.id },
        data: {
          name: input.name,
          durationMonths: Number(input.durationMonths),
          notes: input.notes || null,
        },
      });
      // Assets store their end date, so a new duration must move it too.
      await tx.$executeRaw(recomputeWarrantyEndSql(input.id, Number(input.durationMonths)));
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

  const inUse = await masterInUseMessage("Warranty", { warrantyId: id });

  if (inUse) {
    return { errors: { form: inUse } };
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
