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

const PATH = "/dashboard/master/asset-users";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim(),
    departmentId: String(formData.get("departmentId") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

async function validate(input: ReturnType<typeof readForm>) {
  const errors: ActionState["errors"] = {};

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Format email tidak valid.";
  }

  if (input.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      select: { id: true },
    });

    if (!department) {
      errors.departmentId = "Department tidak ditemukan.";
    }
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createAssetUserAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = await validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetUser.create({
      data: {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        departmentId: input.departmentId || null,
        notes: input.notes || null,
      },
    });
  } catch {
    return { errors: { form: "Asset user gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Asset user berhasil ditambahkan." };
}

export async function updateAssetUserAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset user tidak valid." } };
  }

  const errors = await validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetUser.update({
      where: { id: input.id },
      data: {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        departmentId: input.departmentId || null,
        notes: input.notes || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset user tidak ditemukan." } };
    }

    return { errors: { form: "Asset user gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Asset user berhasil diperbarui." };
}

export async function deleteAssetUserAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset user tidak valid." } };
  }

  const usedByAssets = await prisma.asset.count({ where: { assetUserId: id } });

  if (usedByAssets > 0) {
    return { errors: { form: `Asset user tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.` } };
  }

  try {
    await prisma.assetUser.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset user tidak ditemukan." } };
    }

    return { errors: { form: "Asset user gagal dihapus. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Asset user berhasil dihapus." };
}
