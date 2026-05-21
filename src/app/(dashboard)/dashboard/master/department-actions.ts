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

const PATH = "/dashboard/master/departments";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
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

export async function createDepartmentAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = validate(input);

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

  const errors = validate(input);

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

  const usedByAssets = await prisma.asset.count({ where: { departmentId: id } });

  if (usedByAssets > 0) {
    return { errors: { form: `Department tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.` } };
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
