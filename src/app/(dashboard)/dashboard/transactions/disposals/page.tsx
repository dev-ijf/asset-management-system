import { DisposalForm, ReverseDisposalButton } from "@/components/transactions/transaction-forms";
import type { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/tables/pagination";
import { formatDate, getTransactionOptions, requireAnyPermission } from "@/lib/asset-transaction-view";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginate } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>;
};

function payloadDisposalId(payload: Prisma.JsonValue) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const value = (payload as Record<string, Prisma.JsonValue>).disposalId;
    return typeof value === "string" ? value : null;
  }
  return null;
}

export default async function DisposalsPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission(["assets.view", "disposals.manage"]);
  const canManage = hasPermission(user, "disposals.manage");
  const params = await searchParams;
  const { q = "" } = params;
  const options = await getTransactionOptions("disposal");

  const where: Prisma.AssetDisposalWhereInput | undefined = q
      ? {
          asset: {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : undefined;
  const { items: disposals, pagination } = await paginate(params,
    () => prisma.assetDisposal.count({ where }),
    ({ skip, take }) => prisma.assetDisposal.findMany({ where, skip, take, include: {
      asset: true,
      previousStatus: true,
      disposedStatus: true,
      performedBy: { select: { name: true } },
      reversedBy: { select: { name: true } },
    }, orderBy: { createdAt: "desc" } }),
  );

  // Disposals on this page whose cancellation is waiting for approval.
  const pendingReversals = await prisma.assetApprovalRequest.findMany({
    where: {
      transactionType: "DISPOSAL_REVERSAL",
      status: "PENDING",
      assetId: { in: disposals.map((disposal) => disposal.assetId) },
    },
    select: { payload: true },
  });
  const awaitingReversal = new Set(pendingReversals.map((request) => payloadDisposalId(request.payload)));

  return (
    <>
      <PageHeader
        title="Disposal Aset"
        subtitle="Keluarkan aset yang sudah tidak digunakan, misalnya karena rusak permanen, dijual, hilang, atau dimusnahkan. Disposal dan pembatalannya memerlukan persetujuan."
      />
      <div className="space-y-5">
        <DisposalForm assets={options.assets} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <Input name="q" defaultValue={q} placeholder="Search asset code/name..." />
            </form>
            {disposals.length === 0 ? (
              <EmptyState title="Belum ada data disposal." description="Disposal yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Disposed At</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">By</th>
                      <th className="px-4 py-3">Pembatalan</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {disposals.map((disposal, index) => {
                      const waiting = !disposal.reversedAt && awaitingReversal.has(disposal.id);

                      return (
                        <tr key={disposal.id}>
                          <td className="px-4 py-3">{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                          <td className="px-4 py-3 font-medium">{disposal.asset.code} - {disposal.asset.name}</td>
                          <td className="px-4 py-3">
                            {disposal.reversedAt ? (
                              <Badge variant="warning">Dibatalkan</Badge>
                            ) : waiting ? (
                              <Badge variant="warning">Menunggu approval pembatalan</Badge>
                            ) : (
                              <Badge>Disposed</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">{formatDate(disposal.disposedAt)}</td>
                          <td className="px-4 py-3">{disposal.reason}</td>
                          <td className="px-4 py-3">{disposal.performedBy?.name ?? "-"}</td>
                          <td className="px-4 py-3">
                            {disposal.reversedAt ? (
                              <div className="space-y-1">
                                <div>{disposal.reversalReason ?? "-"}</div>
                                <div className="text-xs text-[var(--muted)]">
                                  {formatDate(disposal.reversedAt)}
                                  {disposal.reversedBy ? ` • disetujui ${disposal.reversedBy.name}` : ""}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {canManage ? (
                              <ReverseDisposalButton
                                disposalId={disposal.id}
                                assetLabel={`${disposal.asset.code} - ${disposal.asset.name}`}
                                disabled={Boolean(disposal.reversedAt) || waiting || Boolean(disposal.asset.deletedAt)}
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination {...pagination} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
