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

const PATH = "/dashboard/master/vendor-contracts";

function readForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    vendorName: String(formData.get("vendorName") ?? "").trim(),
    contractNumber: String(formData.get("contractNumber") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    endDate: String(formData.get("endDate") ?? "").trim(),
    slaResponseHours: String(formData.get("slaResponseHours") ?? "").trim(),
    slaResolutionHours: String(formData.get("slaResolutionHours") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

function parseOptionalDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function parseOptionalInt(value: string) {
  return value ? Number(value) : null;
}

function validate(input: ReturnType<typeof readForm>) {
  const errors: ActionState["errors"] = {};
  const slaResponseHours = parseOptionalInt(input.slaResponseHours);
  const slaResolutionHours = parseOptionalInt(input.slaResolutionHours);

  if (!input.vendorName) {
    errors.vendorName = "Vendor name wajib diisi.";
  }

  if (input.startDate && Number.isNaN(parseOptionalDate(input.startDate)?.getTime())) {
    errors.startDate = "Start date tidak valid.";
  }

  if (input.endDate && Number.isNaN(parseOptionalDate(input.endDate)?.getTime())) {
    errors.endDate = "End date tidak valid.";
  }

  if (input.startDate && input.endDate) {
    const startDate = parseOptionalDate(input.startDate);
    const endDate = parseOptionalDate(input.endDate);

    if (startDate && endDate && endDate < startDate) {
      errors.endDate = "End date tidak boleh lebih awal dari start date.";
    }
  }

  if (input.slaResponseHours && (!Number.isInteger(slaResponseHours) || Number(slaResponseHours) < 0)) {
    errors.slaResponseHours = "SLA response harus berupa angka 0 atau lebih.";
  }

  if (input.slaResolutionHours && (!Number.isInteger(slaResolutionHours) || Number(slaResolutionHours) < 0)) {
    errors.slaResolutionHours = "SLA resolution harus berupa angka 0 atau lebih.";
  }

  return errors;
}

function hasErrors(errors: ActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

export async function createVendorContractAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);
  const errors = validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.vendorContract.create({
      data: {
        vendorName: input.vendorName,
        contractNumber: input.contractNumber || null,
        startDate: parseOptionalDate(input.startDate),
        endDate: parseOptionalDate(input.endDate),
        slaResponseHours: parseOptionalInt(input.slaResponseHours),
        slaResolutionHours: parseOptionalInt(input.slaResolutionHours),
        notes: input.notes || null,
      },
    });
  } catch {
    return { errors: { form: "Vendor contract gagal dibuat. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Vendor contract berhasil ditambahkan." };
}

export async function updateVendorContractAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const input = readForm(formData);

  if (!input.id) {
    return { errors: { form: "Vendor contract tidak valid." } };
  }

  const errors = validate(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.vendorContract.update({
      where: { id: input.id },
      data: {
        vendorName: input.vendorName,
        contractNumber: input.contractNumber || null,
        startDate: parseOptionalDate(input.startDate),
        endDate: parseOptionalDate(input.endDate),
        slaResponseHours: parseOptionalInt(input.slaResponseHours),
        slaResolutionHours: parseOptionalInt(input.slaResolutionHours),
        notes: input.notes || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Vendor contract tidak ditemukan." } };
    }

    return { errors: { form: "Vendor contract gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Vendor contract berhasil diperbarui." };
}

export async function deleteVendorContractAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Vendor contract tidak valid." } };
  }

  const usedByAssets = await prisma.asset.count({ where: { vendorContractId: id } });

  if (usedByAssets > 0) {
    return { errors: { form: `Vendor contract tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.` } };
  }

  try {
    await prisma.vendorContract.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Vendor contract tidak ditemukan." } };
    }

    return { errors: { form: "Vendor contract gagal dihapus. Coba lagi." } };
  }

  revalidatePath(PATH);

  return { ok: true, message: "Vendor contract berhasil dihapus." };
}
