"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { masterInUseMessage } from "@/lib/master-usage";
import { prisma } from "@/lib/prisma";
import { duplicateNameMessage, readName, sameNameWhere } from "@/lib/master-validation";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";
import { isChildCodeOf, LOCATION_CODE_PATTERN } from "@/lib/location-tree";
import { departmentCodeStore, nextCodeUnder, recodeChildren } from "@/lib/hierarchy-codes";

type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const PATH = "/dashboard/master/departments";
const CODE_TAKEN = "Code sudah digunakan departemen lain.";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: readName(formData.get("name")),
    parentId: String(formData.get("parentId") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function validate(input: ReturnType<typeof readForm>, ignoreId?: string) {
  const errors: ActionState["errors"] = {};

  // Only parent (top-level) departments take a typed code; sub-departments get one from their parent.
  if (!input.parentId) {
    if (!input.code) {
      errors.code = "Code wajib diisi untuk parent department.";
    } else if (!LOCATION_CODE_PATTERN.test(input.code)) {
      errors.code = "Code hanya boleh huruf, angka, tanda - atau _, tanpa spasi. Contoh: SKL.";
    }
  }

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  checkLengths(errors, [
    ["code", "Code", input.parentId ? "" : input.code, TEXT_LIMITS.code],
    ["name", "Name", input.name, TEXT_LIMITS.name],
    ["description", "Description", input.description, TEXT_LIMITS.description],
  ]);

  if (!input.parentId && input.code && !errors.code) {
    const existing = await prisma.department.findUnique({ where: { code: input.code }, select: { id: true } });
    if (existing && existing.id !== ignoreId) errors.code = CODE_TAKEN;
  }

  if (input.name && !errors.name) {
    const existing = await prisma.department.findFirst({
      where: { ...sameNameWhere(input.name, ignoreId), parentId: input.parentId || null },
      select: { code: true },
    });
    if (existing) errors.name = duplicateNameMessage("departemen", existing.code, "di parent yang sama");
  }

  if (input.parentId) {
    if (input.parentId === ignoreId) {
      errors.parentId = "Parent department tidak boleh memilih dirinya sendiri.";
    } else {
      const parent = await prisma.department.findUnique({ where: { id: input.parentId }, select: { parentId: true } });
      if (!parent) errors.parentId = "Parent department tidak ditemukan.";

      let currentParentId = parent?.parentId ?? null;
      while (ignoreId && currentParentId) {
        if (currentParentId === ignoreId) {
          errors.parentId = "Parent department tidak boleh berasal dari sub-departemennya sendiri.";
          break;
        }
        const current = await prisma.department.findUnique({ where: { id: currentParentId }, select: { parentId: true } });
        currentParentId = current?.parentId ?? null;
      }
    }
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

function isCodeConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createDepartmentAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = await validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  let code = input.code;
  try {
    await prisma.$transaction(async (tx) => {
      if (input.parentId) code = await nextCodeUnder(departmentCodeStore(tx), input.parentId);
      await tx.department.create({
        data: {
          code,
          name: input.name,
          parentId: input.parentId || null,
          description: input.description || null,
        },
      });
    });
  } catch (error) {
    if (isCodeConflict(error)) {
      return input.parentId
        ? { errors: { form: "Code sub-departemen bentrok dengan penyimpanan lain. Coba simpan ulang." } }
        : { errors: { code: CODE_TAKEN } };
    }

    return { errors: { form: "Department gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: `Department ${code} berhasil ditambahkan.` };
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

  let code = input.code;
  try {
    await prisma.$transaction(async (tx) => {
      const store = departmentCodeStore(tx);
      const existing = await tx.department.findUniqueOrThrow({ where: { id: input.id }, select: { code: true } });

      if (input.parentId) {
        // Keep the current number while it already follows the parent (SKL-03 stays SKL-03).
        const parentCode = await store.codeOf(input.parentId);
        code = isChildCodeOf(existing.code, parentCode) ? existing.code : await nextCodeUnder(store, input.parentId);
      }

      await tx.department.update({
        where: { id: input.id },
        data: {
          code,
          name: input.name,
          parentId: input.parentId || null,
          description: input.description || null,
        },
      });

      if (code !== existing.code) await recodeChildren(store, input.id, existing.code, code);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Department tidak ditemukan." } };
    }

    if (isCodeConflict(error)) {
      return input.parentId
        ? { errors: { form: "Code sub-departemen bentrok dengan departemen lain. Coba simpan ulang." } }
        : { errors: { code: "Code ini (atau code sub-departemen turunannya) sudah dipakai departemen lain." } };
    }

    return { errors: { form: "Department gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: `Department ${code} berhasil diperbarui.` };
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

  const children = await prisma.department.count({ where: { parentId: id } });

  if (children > 0) {
    return { errors: { form: `Department tidak bisa dihapus karena masih memiliki ${children} sub-departemen.` } };
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
