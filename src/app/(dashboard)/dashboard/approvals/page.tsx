import { ApprovalStatus, ApprovalTransactionType, Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { ApproveButton, RejectButton } from "@/components/approvals/approval-actions-client";
import { ApprovalStatusBadge } from "@/components/approvals/approval-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/auth";
import { requireAnyPermission } from "@/lib/asset-transaction-view";
import { approvalTypeLabel } from "@/lib/approval-types";
import { approvalPayloadSummary } from "@/lib/approval-summary";
import { prisma } from "@/lib/prisma";
import { parseDateRange } from "@/lib/date-range";
import { DateRangeAlert, DateRangeInputs } from "@/components/ui/date-range-inputs";
import { paginate } from "@/lib/pagination";
import { wibFormat } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function formatDateTime(date: Date) {
  return wibFormat({
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission(["assets.view", "approvals.manage"]);
  const canManage = hasPermission(user, "approvals.manage");
  const filters = await searchParams;
  const range = parseDateRange(filters.from, filters.to);
  const transactionType = filters.type && filters.type in ApprovalTransactionType
    ? (filters.type as ApprovalTransactionType)
    : undefined;

  const history = filters.view === "history";
  const DECIDED: ApprovalStatus[] = [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.CANCELLED];
  const statusFilter = history && DECIDED.includes(filters.status as ApprovalStatus) ? (filters.status as ApprovalStatus) : undefined;

  const where: Prisma.AssetApprovalRequestWhereInput = {
    // Pending: waiting for a decision. History: decided requests, filtered by when they were decided.
    status: history ? (statusFilter ?? { in: DECIDED }) : ApprovalStatus.PENDING,
    transactionType,
    assetId: filters.asset || undefined,
    ...(history ? { reviewedAt: range.filter } : { createdAt: range.filter }),
    // A reversed range matches nothing; the alert below explains why.
    ...(range.error ? { id: { in: [] } } : {}),
  };
  const [assets, result] = await Promise.all([
    prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
      take: 500,
    }),
    paginate(filters, () => prisma.assetApprovalRequest.count({ where }), ({ skip, take }) => prisma.assetApprovalRequest.findMany({ where, skip, take,
      include: {
        asset: { select: { code: true, name: true } },
        requester: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: history ? [{ reviewedAt: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    })),
  ]);
  const { items: requests, pagination } = result;

  return (
    <>
      <PageHeader
        title={history ? "Riwayat Approval" : "Approval Pending"}
        subtitle={
          history
            ? "Request movement, disposal, dan maintenance yang sudah disetujui atau ditolak, beserta siapa yang memprosesnya."
            : "Kelola request pending untuk movement, disposal, dan maintenance asset."
        }
      />
      <nav className="mb-4 flex gap-2" aria-label="Tampilan approval">
        {[
          { href: "/dashboard/approvals", label: "Pending", active: !history },
          { href: "/dashboard/approvals?view=history", label: "Riwayat", active: history },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
              tab.active
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Card>
        <CardContent className="space-y-5">
          <form className={`grid gap-4 ${history ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
            <input type="hidden" name="limit" value={pagination.pageSize} />
            {history ? (
              <>
                <input type="hidden" name="view" value="history" />
                <Select name="status" defaultValue={statusFilter ?? ""}>
                  <option value="">Semua Status</option>
                  <option value={ApprovalStatus.APPROVED}>Approved</option>
                  <option value={ApprovalStatus.REJECTED}>Rejected</option>
                </Select>
              </>
            ) : null}
            <Select name="type" defaultValue={filters.type ?? ""}>
              <option value="">Semua Jenis</option>
              <option value={ApprovalTransactionType.MOVEMENT}>Movement</option>
              <option value={ApprovalTransactionType.DISPOSAL}>Disposal</option>
              <option value={ApprovalTransactionType.DISPOSAL_REVERSAL}>Pembatalan Disposal</option>
              <option value={ApprovalTransactionType.MAINTENANCE}>Maintenance</option>
            </Select>
            <Select name="asset" defaultValue={filters.asset ?? ""}>
              <option value="">Semua Asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.code} - {asset.name}
                </option>
              ))}
            </Select>
            <DateRangeInputs from={filters.from} to={filters.to} />
            <button className="rounded-md border border-[var(--primary)] bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white" type="submit">
              Filter
            </button>
          </form>

          {history ? (
            <p className="text-xs text-[var(--muted)]">Filter tanggal pada riwayat memakai tanggal request diproses.</p>
          ) : null}
          {range.error ? (
            <DateRangeAlert message={range.error} />
          ) : history ? (
          <DataTable
            columns={["Jenis", "Asset", "Requester", "Diajukan", "Status", "Diproses Oleh", "Diproses", "Ringkasan", "Alasan Reject"]}
            rows={requests.map((request) => [
              approvalTypeLabel(request.transactionType),
              `${request.asset.code} - ${request.asset.name}`,
              request.requester ? request.requester.name : "-",
              formatDateTime(request.createdAt),
              <ApprovalStatusBadge key="status" status={request.status} />,
              request.reviewedBy?.name ?? "-",
              request.reviewedAt ? formatDateTime(request.reviewedAt) : "-",
              approvalPayloadSummary(request.transactionType, request.payload),
              request.status === ApprovalStatus.REJECTED ? (
                <span key="note" className="text-[var(--danger)]">{request.rejectNote ?? "Tanpa alasan"}</span>
              ) : (
                "-"
              ),
            ])}
            emptyTitle="Belum ada riwayat approval."
          />
          ) : (
          <DataTable
            columns={["Jenis", "Asset", "Requester", "Tanggal Request", "Status", "Ringkasan", "Aksi"]}
            rows={requests.map((request) => {
              const label = `${approvalTypeLabel(request.transactionType)} ${request.asset.code}`;

              return [
                approvalTypeLabel(request.transactionType),
                `${request.asset.code} - ${request.asset.name}`,
                request.requester ? `${request.requester.name} (${request.requester.email})` : "-",
                formatDateTime(request.createdAt),
                <ApprovalStatusBadge key="status" status={request.status} />,
                approvalPayloadSummary(request.transactionType, request.payload),
                canManage ? (
                  <div key="actions" className="flex flex-wrap gap-2">
                    <ApproveButton approvalId={request.id} label={label} />
                    <RejectButton approvalId={request.id} label={label} />
                  </div>
                ) : (
                  <span key="readonly" className="text-xs text-[var(--muted)]">
                    View only
                  </span>
                ),
              ];
            })}
            emptyTitle="Tidak ada approval pending."
          />
          )}
          <Pagination {...pagination} />
        </CardContent>
      </Card>
    </>
  );
}
