import type { Prisma } from "@/generated/prisma/client";

export const ACTIVE_STATUS_CODE = "ACTIVE";
export const DISPOSED_STATUS_CODE = "DISPOSED";
/** Status codes the disposal workflow depends on; they cannot be deleted or re-coded in master data. */
export const SYSTEM_STATUS_CODES = [ACTIVE_STATUS_CODE, DISPOSED_STATUS_CODE] as const;

/** Business-rule failure whose message is safe to show to the user. */
export class DisposalRuleError extends Error {}

type DB = Prisma.TransactionClient;

/**
 * Locks the asset row until the surrounding transaction ends.
 * Every disposal, reverse, and approval for the same asset takes this lock first,
 * so their "is there already an active disposal?" checks cannot interleave.
 */
export async function lockAsset(tx: DB, assetId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM assets WHERE id = ${assetId}::uuid FOR UPDATE`;

  if (rows.length === 0) {
    throw new DisposalRuleError("Asset tidak ditemukan.");
  }
}

export async function findStatusIdByCode(db: DB, code: string) {
  const status = await db.assetStatus.findUnique({ where: { code }, select: { id: true } });

  return status?.id ?? null;
}

export async function findActiveDisposal(db: DB, assetId: string) {
  return db.assetDisposal.findFirst({ where: { assetId, reversedAt: null }, select: { id: true } });
}

export async function findPendingDisposalRequest(db: DB, assetId: string) {
  return db.assetApprovalRequest.findFirst({
    where: { assetId, transactionType: "DISPOSAL", status: "PENDING" },
    select: { id: true },
  });
}

export const REVERSAL_REASON_MAX_LENGTH = 500;

export async function findPendingReversalRequest(db: DB, assetId: string) {
  return db.assetApprovalRequest.findFirst({
    where: { assetId, transactionType: "DISPOSAL_REVERSAL", status: "PENDING" },
    select: { id: true },
  });
}

/**
 * Reverses an active disposal. Called only when a DISPOSAL_REVERSAL request is approved,
 * with the asset row already locked by the caller.
 * Disposal only changes the status, so reverse only restores the status:
 * the status before disposal, or ACTIVE when that is unknown. Location and department stay as they are.
 */
export async function reverseDisposal(
  tx: DB,
  input: { disposalId: string; assetId: string; reason: string; reversedById: string },
) {
  const disposal = await tx.assetDisposal.findUnique({
    where: { id: input.disposalId },
    include: { asset: { select: { code: true, deletedAt: true, assetStatusId: true } } },
  });

  if (!disposal || disposal.assetId !== input.assetId) throw new DisposalRuleError("Disposal tidak ditemukan.");
  if (disposal.reversedAt) throw new DisposalRuleError("Disposal sudah dibatalkan sebelumnya. Tolak request ini.");
  if (disposal.asset.deletedAt) throw new DisposalRuleError("Asset yang sudah dihapus tidak bisa dibatalkan disposalnya.");

  // Claim atomically; a concurrent reverse finds nothing left to update.
  const claimed = await tx.assetDisposal.updateMany({
    where: { id: disposal.id, reversedAt: null },
    data: { reversedAt: new Date(), reversedById: input.reversedById, reversalReason: input.reason },
  });

  if (claimed.count !== 1) throw new DisposalRuleError("Disposal sudah dibatalkan sebelumnya. Tolak request ini.");

  const disposedStatusId = disposal.disposedStatusId ?? (await findStatusIdByCode(tx, DISPOSED_STATUS_CODE));
  const restorable = disposal.previousStatusId && disposal.previousStatusId !== disposedStatusId
    ? await tx.assetStatus.findUnique({ where: { id: disposal.previousStatusId }, select: { id: true } })
    : null;
  const restoredStatusId = restorable?.id ?? (await findStatusIdByCode(tx, ACTIVE_STATUS_CODE));

  await tx.asset.update({ where: { id: disposal.assetId }, data: { assetStatusId: restoredStatusId } });

  return { code: disposal.asset.code, fromStatusId: disposal.asset.assetStatusId, toStatusId: restoredStatusId };
}

/**
 * DISPOSED is owned by the disposal workflow: it is set only when a disposal is approved
 * and cleared only by Reverse Disposal. Returns an error message when a manual edit,
 * import, or bulk update tries to cross that boundary.
 */
export function statusChangeError(
  currentStatusId: string | null | undefined,
  nextStatusId: string | null | undefined,
  disposedStatusId: string | null,
) {
  if (!disposedStatusId || nextStatusId === undefined || nextStatusId === currentStatusId) {
    return null;
  }

  if (currentStatusId === disposedStatusId) {
    return "Status asset yang sudah disposal hanya bisa diubah lewat pembatalan disposal yang disetujui.";
  }

  if (nextStatusId === disposedStatusId) {
    return "Status DISPOSED hanya bisa diset lewat transaksi disposal yang disetujui.";
  }

  return null;
}

/** Which transaction the asset dropdown is for; decides which assets can be picked. */
export type TransactionPurpose = "disposal" | "movement" | "other";

/**
 * Same rules the server checks on submit, so the dropdown never offers an asset that will be rejected.
 * Disposed = has an active (not reversed) disposal or status DISPOSED.
 */
export function selectableAssets(purpose: TransactionPurpose): Prisma.AssetWhereInput {
  const where: Prisma.AssetWhereInput = { deletedAt: null };
  if (purpose === "other") return where;

  return {
    ...where,
    disposals: { none: { reversedAt: null } },
    NOT: { assetStatus: { is: { code: DISPOSED_STATUS_CODE } } },
    // Disposal: one pending disposal request per asset.
    ...(purpose === "disposal" ? { approvals: { none: { transactionType: "DISPOSAL", status: "PENDING" } } } : {}),
  };
}
