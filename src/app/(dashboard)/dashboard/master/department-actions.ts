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

const PATH = "/dashboard/master/departments";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: readName(formData.get("name")),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function generateCode() {
  const rows = await prisma.department.findMany({
    where: { code: { startsWith: "DEP-" } },
    select: { code: true },
  });

  return getNextSequentialCode(rows.map((row) => row.code), "DEP");
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
    const existing = await prisma.department.findFirst({ where: sameNameWhere(input.name, ignoreId), select: { code: true } });
    if (existing) errors.name = duplicateNameMessage("departemen", existing.code);
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createDepartmentAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = await validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.department.create({
      data: {
        code: await generateCode(),
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { form: "Code departemen otomatis sudah digunakan. Coba simpan ulang." } };
    }

    return { errors: { form: "Department gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Department berhasil ditambahkan." };
}

export async function updateDepartmentAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);

  if (!input.id) {
    return { errors: { form: "Department tidak valid." } };
  }

  const errors = await validate(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.department.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Department tidak ditemukan." } };
    }

    return { errors: { form: "Department gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Department berhasil diperbarui." };
}

export async function deleteDepartmentAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Department tidak valid." } };
  }

  const inUse = await masterInUseMessage("Department", { departmentId: id });

  if (inUse) {
    return { errors: { form: inUse } };
  }

  try {
    await prisma.department.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Department tidak ditemukan." } };
    }

    return { errors: { form: "Department gagal dihapus. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Department berhasil dihapus." };
}
