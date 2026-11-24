import { NextResponse } from "next/server";
import { ApprovalStatus, AssetRequestStatus } from "@/generated/prisma/client";
import { approvalTypeLabel } from "@/lib/approval-types";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { CLASS_PERMISSIONS } from "@/lib/class-scope";
import { addDays, todayDateOnly } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OPEN_MAINTENANCE = ["OPEN", "IN_PROGRESS"];
const LIST_LIMIT = 5;
/** How long a decided request of the user stays in their notification list. */
const DECISION_WINDOW_DAYS = 7;

const STATUS_TEXT: Record<ApprovalStatus, string> = {
  PENDING: "menunggu approval",
  APPROVED: "disetujui",
  REJECTED: "ditolak",
  CANCELLED: "dibatalkan",
};

const ASSET_REQUEST_TEXT: Record<AssetRequestStatus, string> = {
  PENDING: "menunggu persetujuan",
  APPROVED: "disetujui",
  REJECTED: "ditolak",
  FULFILLED: "sudah diproses",
  CANCELLED: "dibatalkan",
};

const ASSET_REQUESTS_PATH = "/dashboard/asset-requests";

function byNewest(a: NotificationItem, b: NotificationItem) {
  return b.at.localeCompare(a.at);
}

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  at: string;
  status: ApprovalStatus | AssetRequestStatus;
  /** True when the current user made this request, so the topbar does not announce it to them. */
  byMe: boolean;
  /** Where the item opens. */
  href: string;
};

export type NotificationSummary = {
  /** Null when the user cannot open the Maintenance page. */
  maintenance: { open: number; overdue: number } | null;
  /** Pending requests the user can approve (approvals and new-asset requests); null when not an approver. */
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
  // A homeroom teacher cannot open Approvals; their maintenance requests are followed on Kelas Saya.
  const canOpenApprovals = canApprove || hasPermission(user, "assets.view");
  const myApprovalHref = (status: ApprovalStatus) =>
    canOpenApprovals
      ? status === ApprovalStatus.PENDING ? "/dashboard/approvals" : "/dashboard/approvals?view=history"
      : hasPermission(user, CLASS_PERMISSIONS.view) ? "/dashboard/my-class" : "/dashboard";
  const decisionSince = addDays(new Date(), -DECISION_WINDOW_DAYS);
  const openMaintenance = { status: { in: OPEN_MAINTENANCE }, asset: { deletedAt: null } };
  const pendingWhere = { status: ApprovalStatus.PENDING, asset: { deletedAt: null } };
  const include = {
    asset: { select: { code: true, name: true } },
    requester: { select: { name: true } },
    reviewedBy: { select: { name: true } },
  } as const;

  const [maintenanceOpen, maintenanceOverdue, pendingCount, pendingItems, mine, assetRequestCount, assetRequestItems, myAssetRequests] = await Promise.all([
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
    canApprove ? prisma.assetRequest.count({ where: { status: AssetRequestStatus.PENDING } }) : 0,
    canApprove
      ? prisma.assetRequest.findMany({
          where: { status: AssetRequestStatus.PENDING },
          include: { requester: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: LIST_LIMIT,
        })
      : [],
    prisma.assetRequest.findMany({
      where: {
        requesterId: user.id,
        OR: [
          { status: AssetRequestStatus.PENDING },
          { reviewedAt: { gte: decisionSince } },
          { fulfilledAt: { gte: decisionSince } },
        ],
      },
      include: { reviewedBy: { select: { name: true } }, fulfilledBy: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: LIST_LIMIT,
    }),
  ]);

  const body: NotificationSummary = {
    maintenance: canSeeMaintenance ? { open: maintenanceOpen, overdue: maintenanceOverdue } : null,
    approvals: canApprove
      ? {
          pending: pendingCount + assetRequestCount,
          items: [
            ...pendingItems.map((request) => ({
              id: request.id,
              title: `${approvalTypeLabel(request.transactionType)} menunggu approval`,
              detail: `${request.asset.code} - ${request.asset.name} · oleh ${request.requester?.name ?? "-"}`,
              at: request.createdAt.toISOString(),
              status: request.status,
              byMe: request.requesterId === user.id,
              href: "/dashboard/approvals",
            })),
            ...assetRequestItems.map((request) => ({
              id: request.id,
              title: "Pengajuan asset baru menunggu persetujuan",
              detail: `${request.itemName} (${request.quantity}) · oleh ${request.requester?.name ?? "-"}`,
              at: request.createdAt.toISOString(),
              status: request.status,
              byMe: request.requesterId === user.id,
              href: `${ASSET_REQUESTS_PATH}?status=PENDING`,
            })),
          ]
            .sort(byNewest)
            .slice(0, LIST_LIMIT),
        }
      : null,
    mine: [
      ...mine.map((request) => ({
        id: request.id,
        title: `${approvalTypeLabel(request.transactionType)} Anda ${STATUS_TEXT[request.status]}`,
        detail: `${request.asset.code} - ${request.asset.name}${
          request.reviewedBy ? ` · oleh ${request.reviewedBy.name}` : ""
        }${request.status === ApprovalStatus.REJECTED && request.rejectNote ? ` · ${request.rejectNote}` : ""}`,
        at: (request.reviewedAt ?? request.createdAt).toISOString(),
        status: request.status,
        byMe: true,
        href: myApprovalHref(request.status),
      })),
      ...myAssetRequests.map((request) => {
        const by = request.status === AssetRequestStatus.FULFILLED ? request.fulfilledBy : request.reviewedBy;
        return {
          id: request.id,
          title: `Pengajuan asset Anda ${ASSET_REQUEST_TEXT[request.status]}`,
          detail: `${request.itemName} (${request.quantity})${by ? ` · oleh ${by.name}` : ""}${
            request.status === AssetRequestStatus.REJECTED && request.rejectNote ? ` · ${request.rejectNote}` : ""
          }`,
          at: (request.fulfilledAt ?? request.reviewedAt ?? request.createdAt).toISOString(),
          status: request.status,
          byMe: true,
          href: ASSET_REQUESTS_PATH,
        };
      }),
    ]
      .sort(byNewest)
      .slice(0, LIST_LIMIT),
  };

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
