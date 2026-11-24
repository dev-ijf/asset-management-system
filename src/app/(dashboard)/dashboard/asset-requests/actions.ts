"use server";

import { revalidatePath } from "next/cache";
import { AssetRequestStatus } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { REJECT_NOTE_MIN } from "@/lib/approval-types";
import { CLASS_PERMISSIONS, getClassScope } from "@/lib/class-scope";
import { prisma } from "@/lib/prisma";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";

export type AssetRequestActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const PATH = "/dashboard/asset-requests";
const MAX_QUANTITY = 1000;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function done(message: string): AssetRequestActionState {
  revalidatePath(PATH);
  revalidatePath("/dashboard/my-class");
  return { ok: true, message };
}

/** A homeroom teacher asks for a new asset for their class. */
export async function createAssetRequestAction(
  _state: AssetRequestActionState,
  formData: FormData,
): Promise<AssetRequestActionState> {
  const user = await requirePermission(CLASS_PERMISSIONS.requestAsset);
  const itemName = getString(formData, "itemName");
  const quantityInput = getString(formData, "quantity");
  const quantity = Number(quantityInput || "1");
  const reason = getString(formData, "reason");
  const notes = getString(formData, "notes");
  const errors: Record<string, string | undefined> = {};

  if (!itemName) errors.itemName = "Nama barang wajib diisi.";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    errors.quantity = `Jumlah harus bilangan bulat 1–${MAX_QUANTITY}.`;
  }
  if (!reason) errors.reason = "Alasan pengajuan wajib diisi.";
  checkLengths(errors, [
    ["itemName", "Nama barang", itemName, TEXT_LIMITS.name],
    ["reason", "Alasan", reason, TEXT_LIMITS.description],
    ["notes", "Spesifikasi / catatan", notes, TEXT_LIMITS.description],
  ]);
  if (Object.values(errors).some(Boolean)) return { errors, message: "Periksa kembali isian pengajuan." };

  const scope = await getClassScope(user.id);

  try {
    await prisma.assetRequest.create({
      data: {
        itemName,
        quantity,
        reason,
        notes: notes || null,
        assetLocationId: scope?.location.id ?? null,
        requesterId: user.id,
      },
    });
  } catch {
    return { message: "Pengajuan gagal dikirim. Silakan coba lagi." };
  }
  return done("Pengajuan asset baru terkirim dan menunggu persetujuan.");
}

/** The requester withdraws their own request while it still waits. */
export async function cancelAssetRequestAction(
  _state: AssetRequestActionState,
  formData: FormData,
): Promise<AssetRequestActionState> {
  const user = await requirePermission(CLASS_PERMISSIONS.requestAsset);
  const id = getString(formData, "id");
  const result = await prisma.assetRequest.updateMany({
    where: { id, requesterId: user.id, status: AssetRequestStatus.PENDING },
    data: { status: AssetRequestStatus.CANCELLED },
  });
  if (result.count !== 1) return { message: "Pengajuan sudah diproses atau tidak ditemukan." };
  return done("Pengajuan dibatalkan.");
}

export async function approveAssetRequestAction(
  _state: AssetRequestActionState,
  formData: FormData,
): Promise<AssetRequestActionState> {
  const user = await requirePermission("approvals.manage");
  const id = getString(formData, "id");
  // Claim only a pending request, so a double click or a second reviewer changes nothing.
  const result = await prisma.assetRequest.updateMany({
    where: { id, status: AssetRequestStatus.PENDING },
    data: { status: AssetRequestStatus.APPROVED, reviewedById: user.id, reviewedAt: new Date() },
  });
  if (result.count !== 1) return { message: "Pengajuan sudah diproses." };
  return done("Pengajuan disetujui. Tandai 'Sudah diproses' setelah barang dibeli dan didaftarkan.");
}

export async function rejectAssetRequestAction(
  _state: AssetRequestActionState,
  formData: FormData,
): Promise<AssetRequestActionState> {
  const user = await requirePermission("approvals.manage");
  const id = getString(formData, "id");
  const rejectNote = getString(formData, "rejectNote");
  // The requester only sees this note, so a rejection must say why.
  if (rejectNote.length < REJECT_NOTE_MIN) {
    return { errors: { rejectNote: `Alasan penolakan minimal ${REJECT_NOTE_MIN} karakter.` }, message: "Alasan penolakan wajib diisi." };
  }
  if (rejectNote.length > TEXT_LIMITS.description) {
    return { errors: { rejectNote: `Maksimal ${TEXT_LIMITS.description} karakter.` }, message: "Alasan penolakan terlalu panjang." };
  }
  const result = await prisma.assetRequest.updateMany({
    where: { id, status: AssetRequestStatus.PENDING },
    data: { status: AssetRequestStatus.REJECTED, rejectNote, reviewedById: user.id, reviewedAt: new Date() },
  });
  if (result.count !== 1) return { message: "Pengajuan sudah diproses." };
  return done("Pengajuan ditolak.");
}

/** After purchase: close an approved request, optionally linking the asset that was registered. */
export async function fulfillAssetRequestAction(
  _state: AssetRequestActionState,
  formData: FormData,
): Promise<AssetRequestActionState> {
  const user = await requirePermission("assets.manage");
  const id = getString(formData, "id");
  const assetCode = getString(formData, "assetCode");
  const note = getString(formData, "fulfilledNote");

  if (note.length > TEXT_LIMITS.description) {
    return { errors: { fulfilledNote: `Maksimal ${TEXT_LIMITS.description} karakter.` }, message: "Catatan terlalu panjang." };
  }

  let assetId: string | null = null;
  if (assetCode) {
    const asset = await prisma.asset.findFirst({ where: { code: { equals: assetCode, mode: "insensitive" }, deletedAt: null }, select: { id: true } });
    if (!asset) return { errors: { assetCode: "Kode asset tidak ditemukan." }, message: "Kode asset tidak ditemukan." };
    assetId = asset.id;
  }

  const result = await prisma.assetRequest.updateMany({
    where: { id, status: AssetRequestStatus.APPROVED },
    data: {
      status: AssetRequestStatus.FULFILLED,
      fulfilledById: user.id,
      fulfilledAt: new Date(),
      fulfilledNote: note || null,
      fulfilledAssetId: assetId,
    },
  });
  if (result.count !== 1) return { message: "Hanya pengajuan yang sudah disetujui yang bisa ditandai sudah diproses." };
  return done("Pengajuan ditandai sudah diproses.");
}
