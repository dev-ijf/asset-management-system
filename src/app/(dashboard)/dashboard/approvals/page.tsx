import { ApprovalStatus, ApprovalTransactionType, Prisma } from "@/generated/prisma/client";
import { ApproveButton, RejectButton } from "@/components/approvals/approval-actions-client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/auth";
import { requireAnyPermission } from "@/lib/asset-transaction-view";
import { approvalTypeLabel } from "@/lib/approval-types";
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

function payloadObject(payload: Prisma.JsonValue) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, Prisma.JsonValue>;
  }

  return {};
}

function payloadSummary(type: ApprovalTransactionType, payload: Prisma.JsonValue) {
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

function statusBadge(status: ApprovalStatus) {
  if (status === ApprovalStatus.PENDING) return <Badge variant="warning">PENDING</Badge>;
  if (status === ApprovalStatus.APPROVED) return <Badge variant="success">APPROVED</Badge>;
  if (status === ApprovalStatus.REJECTED) return <Badge variant="danger">REJECTED</Badge>;
  return <Badge>{status}</Badge>;
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission(["assets.view", "approvals.manage"]);
  const canManage = hasPermission(user, "approvals.manage");
  const filters = await searchParams;
  const range = parseDateRange(filters.from, filters.to);
  const transactionType = filters.type && filters.type in ApprovalTransactionType
    ? (filters.type as ApprovalTransactionType)
    : undefined;

  const where: Prisma.AssetApprovalRequestWhereInput = {
    status: ApprovalStatus.PENDING,
    transactionType,
    assetId: filters.asset || undefined,
    createdAt: range.filter,
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
      },
      orderBy: { createdAt: "desc" },
    })),
  ]);
  const { items: requests, pagination } = result;

  return (
    <>
      <PageHeader
        title="Approval Pending"
        subtitle="Kelola request pending untuk movement, disposal, dan maintenance asset."
      />
      <Card>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-5">
            <input type="hidden" name="limit" value={pagination.pageSize} />
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

          {range.error ? (
            <DateRangeAlert message={range.error} />
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
                statusBadge(request.status),
                payloadSummary(request.transactionType, request.payload),
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
