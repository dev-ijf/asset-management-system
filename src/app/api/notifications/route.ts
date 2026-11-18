import { NextResponse } from "next/server";
import { ApprovalStatus } from "@/generated/prisma/client";
import { approvalTypeLabel } from "@/lib/approval-types";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { addDays, todayDateOnly } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OPEN_MAINTENANCE = ["OPEN", "IN_PROGRESS"];
const LIST_LIMIT = 5;
/** How long a decided request of the user stays in their notification list. */
const DECISION_WINDOW_DAYS = 7;

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  at: string;
  status: ApprovalStatus;
};

export type NotificationSummary = {
  /** Null when the user cannot open the Maintenance page. */
  maintenance: { open: number; overdue: number } | null;
  /** Pending requests the user can approve; null when the user is not an approver. */
  approvals: { pending: number; items: NotificationItem[] } | null;
  /** The user's own requests: pending, or decided in the last few days. */
  mine: NotificationItem[];
};

/** Topbar badges and the notification list, read by the header on navigation and every minute. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const canSeeMaintenance = hasPermission(user, "assets.view") || hasPermission(user, "maintenance.manage");
  const canApprove = hasPermission(user, "approvals.manage");
  const openMaintenance = { status: { in: OPEN_MAINTENANCE }, asset: { deletedAt: null } };
  const pendingWhere = { status: ApprovalStatus.PENDING, asset: { deletedAt: null } };
  const include = {
    asset: { select: { code: true, name: true } },
    requester: { select: { name: true } },
    reviewedBy: { select: { name: true } },
  } as const;

  const [maintenanceOpen, maintenanceOverdue, pendingCount, pendingItems, mine] = await Promise.all([
    canSeeMaintenance ? prisma.assetMaintenance.count({ where: openMaintenance }) : 0,
    canSeeMaintenance
      ? prisma.assetMaintenance.count({ where: { ...openMaintenance, scheduledDate: { lt: todayDateOnly() } } })
      : 0,
    canApprove ? prisma.assetApprovalRequest.count({ where: pendingWhere }) : 0,
    canApprove
      ? prisma.assetApprovalRequest.findMany({ where: pendingWhere, include, orderBy: { createdAt: "desc" }, take: LIST_LIMIT })
      : [],
    prisma.assetApprovalRequest.findMany({
      where: {
        requesterId: user.id,
        OR: [
          { status: ApprovalStatus.PENDING },
          { reviewedAt: { gte: addDays(new Date(), -DECISION_WINDOW_DAYS) } },
        ],
      },
      include,
      orderBy: { updatedAt: "desc" },
      take: LIST_LIMIT,
    }),
  ]);

  const body: NotificationSummary = {
    maintenance: canSeeMaintenance ? { open: maintenanceOpen, overdue: maintenanceOverdue } : null,
    approvals: canApprove
      ? {
          pending: pendingCount,
          items: pendingItems.map((request) => ({
            id: request.id,
            title: `${approvalTypeLabel(request.transactionType)} menunggu approval`,
            detail: `${request.asset.code} - ${request.asset.name} · oleh ${request.requester?.name ?? "-"}`,
            at: request.createdAt.toISOString(),
            status: request.status,
          })),
        }
      : null,
    mine: mine.map((request) => ({
      id: request.id,
      title: `${approvalTypeLabel(request.transactionType)} Anda ${
        request.status === ApprovalStatus.APPROVED ? "disetujui" : request.status === ApprovalStatus.REJECTED ? "ditolak" : "menunggu approval"
      }`,
      detail: `${request.asset.code} - ${request.asset.name}${
        request.reviewedBy ? ` · oleh ${request.reviewedBy.name}` : ""
      }${request.status === ApprovalStatus.REJECTED && request.rejectNote ? ` · ${request.rejectNote}` : ""}`,
      at: (request.reviewedAt ?? request.createdAt).toISOString(),
      status: request.status,
    })),
  };

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
