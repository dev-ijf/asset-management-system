import { ApprovalTransactionType, type Prisma } from "@/generated/prisma/client";

function payloadObject(payload: Prisma.JsonValue) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, Prisma.JsonValue>;
  }

  return {};
}

/** One-line description of what an approval request asks for, from its payload. */
export function approvalPayloadSummary(type: ApprovalTransactionType, payload: Prisma.JsonValue) {
  const data = payloadObject(payload);

  if (type === ApprovalTransactionType.MOVEMENT) {
    const targets = [
      data.toLocationId ? "lokasi" : null,
      data.toDepartmentId ? "departemen" : null,
      data.toAssetUserId ? "user" : null,
    ].filter(Boolean);

    return targets.length ? `Ubah ${targets.join(", ")}` : "Movement asset";
  }

  if (type === ApprovalTransactionType.DISPOSAL) {
    return typeof data.reason === "string" && data.reason ? data.reason : "Disposal asset";
  }

  if (type === ApprovalTransactionType.DISPOSAL_REVERSAL) {
    return typeof data.reason === "string" && data.reason ? `Alasan pembatalan: ${data.reason}` : "Pembatalan disposal";
  }

  if (type === ApprovalTransactionType.MAINTENANCE) {
    return typeof data.description === "string" && data.description ? data.description : "Maintenance asset";
  }

  return "-";
}
