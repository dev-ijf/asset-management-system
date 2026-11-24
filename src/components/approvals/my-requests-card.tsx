import Link from "next/link";
import { ApprovalStatus, type ApprovalTransactionType } from "@/generated/prisma/client";
import { ApprovalStatusBadge } from "@/components/approvals/approval-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approvalTypeLabel } from "@/lib/approval-types";
import { approvalPayloadSummary } from "@/lib/approval-summary";
import { addDays, wibFormat } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";

/** Rejected requests stay visible this long, so the requester sees the reason. */
const REJECTED_VISIBLE_DAYS = 7;
const LIMIT = 10;

/**
 * The current user's requests of these types that are still waiting for approval, plus ones
 * rejected in the last week. Shown on the Movement / Maintenance / Disposal pages, because a
 * request only appears in their main table after it is approved. Renders nothing when empty.
 */
export async function MyRequestsCard({
  userId,
  types,
  note = "Request baru masuk tabel di bawah setelah disetujui.",
  historyHref = "/dashboard/approvals?view=history",
}: {
  userId: string;
  types: ApprovalTransactionType[];
  note?: string;
  /** Null hides the link, for users who cannot open Approvals. */
  historyHref?: string | null;
}) {
  const requests = await prisma.assetApprovalRequest.findMany({
    where: {
      requesterId: userId,
      transactionType: { in: types },
      OR: [
        { status: ApprovalStatus.PENDING },
        { status: ApprovalStatus.REJECTED, reviewedAt: { gte: addDays(new Date(), -REJECTED_VISIBLE_DAYS) } },
      ],
    },
    include: {
      asset: { select: { code: true, name: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });

  if (requests.length === 0) return null;

  const pending = requests.filter((request) => request.status === ApprovalStatus.PENDING).length;
  const time = wibFormat({ day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Request Saya</CardTitle>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {pending > 0 ? `${pending} request menunggu approval. ` : ""}
            {note} Request yang ditolak tampil di sini selama {REJECTED_VISIBLE_DAYS} hari.
          </p>
        </div>
        {historyHref ? (
          <Link href={historyHref} className="text-sm font-medium text-[var(--primary)] hover:underline">
            Lihat riwayat approval
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="whitespace-nowrap bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">Jenis</th>
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Ringkasan</th>
                <th className="px-3 py-2">Diajukan</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {requests.map((request) => (
                <tr key={request.id} className="align-top">
                  <td className="px-3 py-2">{approvalTypeLabel(request.transactionType)}</td>
                  <td className="px-3 py-2 font-medium">{request.asset.code} - {request.asset.name}</td>
                  <td className="px-3 py-2 max-w-[24rem] [overflow-wrap:break-word]">{approvalPayloadSummary(request.transactionType, request.payload)}</td>
                  <td className="px-3 py-2">{time.format(request.createdAt)}</td>
                  <td className="px-3 py-2"><ApprovalStatusBadge status={request.status} /></td>
                  <td className="px-3 py-2 max-w-[24rem] [overflow-wrap:break-word]">
                    {request.status === ApprovalStatus.REJECTED ? (
                      <>
                        <span className="text-[var(--danger)]">{request.rejectNote ?? "Tanpa alasan"}</span>
                        <span className="block text-xs text-[var(--muted)]">
                          oleh {request.reviewedBy?.name ?? "-"}{request.reviewedAt ? `, ${time.format(request.reviewedAt)}` : ""}
                        </span>
                      </>
                    ) : (
                      <span className="text-[var(--muted)]">Menunggu approval</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
