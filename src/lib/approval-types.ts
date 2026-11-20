import { ApprovalTransactionType } from "@/generated/prisma/enums";

/** Display labels for approval request types, shared by the approval list, dashboard and history. */
export const APPROVAL_TYPE_LABELS: Record<ApprovalTransactionType, string> = {
  [ApprovalTransactionType.MOVEMENT]: "Movement",
  [ApprovalTransactionType.DISPOSAL]: "Disposal",
  [ApprovalTransactionType.DISPOSAL_REVERSAL]: "Pembatalan Disposal",
  [ApprovalTransactionType.MAINTENANCE]: "Maintenance",
};

/** Shortest accepted reject reason: enough to rule out "-" or "x" while allowing "Duplikat". */
export const REJECT_NOTE_MIN = 5;

export function approvalTypeLabel(type: ApprovalTransactionType) {
  return APPROVAL_TYPE_LABELS[type] ?? type;
}
