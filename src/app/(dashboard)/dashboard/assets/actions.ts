"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { CapexOpex, DepreciationMethod, Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { prisma } from "@/lib/prisma";
import { getNextSequentialCode } from "@/lib/sequential-code";

export type AssetActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const ASSETS_PATH = "/dashboard/assets";
const DEPRECIATION_METHODS = Object.values(DepreciationMethod);
const CAPEX_OPEX_VALUES = Object.values(CapexOpex);

function readAssetForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    serialNumber: String(formData.get("serialNumber") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    assetStatusId: String(formData.get("assetStatusId") ?? "").trim(),
    assetClassId: String(formData.get("assetClassId") ?? "").trim(),
    assetCategoryId: String(formData.get("assetCategoryId") ?? "").trim(),
    assetLocationId: String(formData.get("assetLocationId") ?? "").trim(),
    unitId: String(formData.get("unitId") ?? "").trim(),
    departmentId: String(formData.get("departmentId") ?? "").trim(),
    personInChargeId: String(formData.get("personInChargeId") ?? "").trim(),
    assetUserId: String(formData.get("assetUserId") ?? "").trim(),
    warrantyId: String(formData.get("warrantyId") ?? "").trim(),
    vendorContractId: String(formData.get("vendorContractId") ?? "").trim(),
    purchaseDate: String(formData.get("purchaseDate") ?? "").trim(),
    cost: String(formData.get("cost") ?? "").trim(),
    residualValue: String(formData.get("residualValue") ?? "").trim(),
    usefulLifeMonths: String(formData.get("usefulLifeMonths") ?? "").trim(),
    depreciationMethod: String(formData.get("depreciationMethod") ?? "STRAIGHT_LINE").trim(),
    capexOpex: String(formData.get("capexOpex") ?? "").trim(),
    metadata: String(formData.get("metadata") ?? "").trim(),
    qrPath: String(formData.get("qrPath") ?? "").trim(),
    rfidTag: String(formData.get("rfidTag") ?? "").trim(),
    nfcTag: String(formData.get("nfcTag") ?? "").trim(),
    labelTemplate: String(formData.get("labelTemplate") ?? "").trim(),
    isConsumable: formData.get("isConsumable") === "on",
    quantity: String(formData.get("quantity") ?? "1").trim(),
    availableQuantity: String(formData.get("availableQuantity") ?? "").trim(),
    isPool: formData.get("isPool") === "on",
    retentionUntil: String(formData.get("retentionUntil") ?? "").trim(),
  };
}

function parseOptionalDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

async function existsById(model: { findUnique: (args: { where: { id: string }; select: { id: true } }) => Promise<{ id: string } | null> }, id: string) {
  if (!id) {
    return true;
  }

  return Boolean(await model.findUnique({ where: { id }, select: { id: true } }));
}

async function validateAssetInput(input: ReturnType<typeof readAssetForm>, ignoreId?: string) {
  const errors: AssetActionState["errors"] = {};

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  const cost = parseOptionalNumber(input.cost);
  const residualValue = parseOptionalNumber(input.residualValue);
  const usefulLifeMonths = parseOptionalInteger(input.usefulLifeMonths);
  const quantity = parseOptionalInteger(input.quantity);
  const availableQuantity = parseOptionalInteger(input.availableQuantity);

  if (input.cost && (cost === null || cost < 0)) {
    errors.cost = "Cost harus berupa angka 0 atau lebih.";
  }

  if (input.residualValue && (residualValue === null || residualValue < 0)) {
    errors.residualValue = "Residual value harus berupa angka 0 atau lebih.";
  }

  if (input.usefulLifeMonths && (usefulLifeMonths === null || usefulLifeMonths < 1)) {
    errors.usefulLifeMonths = "Useful life months harus berupa integer positif.";
  }

  if (!input.quantity || quantity === null || quantity < 1) {
    errors.quantity = "Quantity wajib berupa integer minimal 1.";
  }

  if (input.availableQuantity && (availableQuantity === null || availableQuantity < 0)) {
    errors.availableQuantity = "Available quantity harus berupa integer 0 atau lebih.";
  }

  if (availableQuantity !== null && quantity !== null && availableQuantity > quantity) {
    errors.availableQuantity = "Available quantity tidak boleh lebih besar dari quantity.";
  }

  if (input.purchaseDate && !parseOptionalDate(input.purchaseDate)) {
    errors.purchaseDate = "Purchase date tidak valid.";
  }

  if (input.retentionUntil && !parseOptionalDate(input.retentionUntil)) {
    errors.retentionUntil = "Retention until tidak valid.";
  }

  if (!DEPRECIATION_METHODS.includes(input.depreciationMethod as DepreciationMethod)) {
    errors.depreciationMethod = "Depreciation method tidak valid.";
  }

  if (input.capexOpex && !CAPEX_OPEX_VALUES.includes(input.capexOpex as CapexOpex)) {
    errors.capexOpex = "Capex/Opex tidak valid.";
  }

  if (input.metadata) {
    try {
      JSON.parse(input.metadata);
    } catch {
      errors.metadata = "Metadata harus berupa JSON valid.";
    }
  }

  const relations = [
    ["assetStatusId", input.assetStatusId, prisma.assetStatus],
    ["assetClassId", input.assetClassId, prisma.assetClass],
    ["assetCategoryId", input.assetCategoryId, prisma.assetCategory],
    ["assetLocationId", input.assetLocationId, prisma.assetLocation],
    ["unitId", input.unitId, prisma.unit],
    ["departmentId", input.departmentId, prisma.department],
    ["personInChargeId", input.personInChargeId, prisma.personInCharge],
    ["assetUserId", input.assetUserId, prisma.assetUser],
    ["warrantyId", input.warrantyId, prisma.warranty],
    ["vendorContractId", input.vendorContractId, prisma.vendorContract],
  ] as const;

  for (const [field, id, model] of relations) {
    if (!(await existsById(model, id))) {
      errors[field] = "Data pilihan tidak ditemukan.";
    }
  }

  if (input.rfidTag) {
    const existing = await prisma.asset.findUnique({
      where: { rfidTag: input.rfidTag },
      select: { id: true },
    });

    if (existing && existing.id !== ignoreId) {
      errors.rfidTag = "RFID tag sudah digunakan.";
    }
  }

  if (input.nfcTag) {
    const existing = await prisma.asset.findUnique({
      where: { nfcTag: input.nfcTag },
      select: { id: true },
    });

    if (existing && existing.id !== ignoreId) {
      errors.nfcTag = "NFC tag sudah digunakan.";
    }
  }

  return errors;
}

function hasErrors(errors: AssetActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

async function generateAssetCode() {
  const rows = await prisma.asset.findMany({
    where: { code: { startsWith: "AST-" } },
    select: { code: true },
  });

  return getNextSequentialCode(rows.map((row) => row.code), "AST");
}

async function generateQrToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = `qr_${randomUUID().replaceAll("-", "")}`;
    const existing = await prisma.asset.findUnique({
      where: { qrToken: token },
      select: { id: true },
    });

    if (!existing) {
      return token;
    }
  }

  throw new Error("Unable to generate unique QR token.");
}

async function getDefaultStatusId(selectedStatusId: string) {
  if (selectedStatusId) {
    return selectedStatusId;
  }

  const activeStatus = await prisma.assetStatus.findUnique({
    where: { code: "ACTIVE" },
    select: { id: true },
  });

  return activeStatus?.id ?? null;
}

function buildAssetData(input: ReturnType<typeof readAssetForm>, assetStatusId: string | null) {
  return {
    name: input.name,
    serialNumber: input.serialNumber || null,
    description: input.description || null,
    assetStatusId,
    assetClassId: input.assetClassId || null,
    assetCategoryId: input.assetCategoryId || null,
    assetLocationId: input.assetLocationId || null,
    unitId: input.unitId || null,
    departmentId: input.departmentId || null,
    personInChargeId: input.personInChargeId || null,
    assetUserId: input.assetUserId || null,
    warrantyId: input.warrantyId || null,
    vendorContractId: input.vendorContractId || null,
    purchaseDate: parseOptionalDate(input.purchaseDate),
    cost: input.cost ? input.cost : null,
    residualValue: input.residualValue ? input.residualValue : null,
    usefulLifeMonths: parseOptionalInteger(input.usefulLifeMonths),
    depreciationMethod: input.depreciationMethod as DepreciationMethod,
    capexOpex: input.capexOpex ? (input.capexOpex as CapexOpex) : null,
    metadata: input.metadata ? JSON.parse(input.metadata) : Prisma.JsonNull,
    qrPath: input.qrPath || null,
    rfidTag: input.rfidTag || null,
    nfcTag: input.nfcTag || null,
    labelTemplate: input.labelTemplate || null,
    isConsumable: input.isConsumable,
    quantity: parseOptionalInteger(input.quantity) ?? 1,
    availableQuantity: parseOptionalInteger(input.availableQuantity),
    isPool: input.isPool,
    retentionUntil: parseOptionalDate(input.retentionUntil),
  };
}

export async function createAssetAction(_previousState: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const user = await requirePermission("assets.manage");

  const input = readAssetForm(formData);
  const errors = await validateAssetInput(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    const assetStatusId = await getDefaultStatusId(input.assetStatusId);
    const code = await generateAssetCode();
    const qrToken = await generateQrToken();

    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          code,
          qrToken,
          ...buildAssetData(input, assetStatusId),
        },
      });

      await createAssetHistory({
        action: "CREATED",
        assetId: asset.id,
        changedById: user.id,
        description: `Asset ${asset.code} dibuat.`,
        payload: { code: asset.code, name: asset.name },
        tx,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { form: "Code, QR token, RFID, atau NFC sudah digunakan. Coba simpan ulang." } };
    }

    return { errors: { form: "Asset gagal dibuat. Coba lagi." } };
  }

  revalidatePath(ASSETS_PATH);

  return { ok: true, message: "Asset berhasil ditambahkan." };
}

export async function updateAssetAction(_previousState: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const user = await requirePermission("assets.manage");

  const input = readAssetForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset tidak valid." } };
  }

  const errors = await validateAssetInput(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id: input.id },
        data: buildAssetData(input, input.assetStatusId || null),
      });

      await createAssetHistory({
        action: "UPDATED",
        assetId: asset.id,
        changedById: user.id,
        description: `Asset ${asset.code} diperbarui.`,
        payload: { code: asset.code, name: asset.name },
        tx,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { form: "RFID atau NFC sudah digunakan." } };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset tidak ditemukan." } };
    }

    return { errors: { form: "Asset gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(ASSETS_PATH);
  revalidatePath(`${ASSETS_PATH}/${input.id}`);

  return { ok: true, message: "Asset berhasil diperbarui." };
}

export async function archiveAssetAction(_previousState: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const user = await requirePermission("assets.manage");
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset tidak valid." } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: {
          archivedAt: new Date(),
          archivedById: user.id,
        },
      });

      await createAssetHistory({
        action: "ARCHIVED",
        assetId: asset.id,
        changedById: user.id,
        description: `Asset ${asset.code} diarsipkan.`,
        payload: { archivedAt: asset.archivedAt?.toISOString() ?? null },
        tx,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset tidak ditemukan." } };
    }

    return { errors: { form: "Asset gagal diarsipkan. Coba lagi." } };
  }

  revalidatePath(ASSETS_PATH);
  revalidatePath(`${ASSETS_PATH}/${id}`);

  return { ok: true, message: "Asset berhasil diarsipkan." };
}

export async function softDeleteAssetAction(_previousState: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const user = await requirePermission("assets.manage");
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset tidak valid." } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      await createAssetHistory({
        action: "DELETED",
        assetId: asset.id,
        changedById: user.id,
        description: `Asset ${asset.code} dihapus secara soft delete.`,
        payload: { deletedAt: asset.deletedAt?.toISOString() ?? null },
        tx,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset tidak ditemukan." } };
    }

    return { errors: { form: "Asset gagal dihapus. Coba lagi." } };
  }

  revalidatePath(ASSETS_PATH);
  revalidatePath(`${ASSETS_PATH}/${id}`);

  return { ok: true, message: "Asset berhasil dihapus." };
}
