import { DisposalForm, ReverseDisposalButton } from "@/components/transactions/transaction-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate, getTransactionOptions, requireAnyPermission } from "@/lib/asset-transaction-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DisposalsPage({ searchParams }: PageProps) {
  await requireAnyPermission(["assets.view", "disposals.manage"]);
  const { q = "" } = await searchParams;
  const options = await getTransactionOptions();

  const disposals = await prisma.assetDisposal.findMany({
    where: q
      ? {
          asset: {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : undefined,
    include: {
      asset: true,
      previousStatus: true,
      disposedStatus: true,
      performedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Disposal Aset" subtitle="Catat disposal asset dan reverse basic jika diperlukan." />
      <div className="space-y-5">
        <DisposalForm assets={options.assets} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <Input name="q" defaultValue={q} placeholder="Search asset code/name..." />
            </form>
            {disposals.length === 0 ? (
              <EmptyState title="Belum ada data disposal." description="Disposal yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Disposed At</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">By</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {disposals.map((disposal, index) => (
                      <tr key={disposal.id}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{disposal.asset.code} - {disposal.asset.name}</td>
                        <td className="px-4 py-3">{disposal.reversedAt ? <Badge variant="warning">Reversed</Badge> : <Badge>Disposed</Badge>}</td>
                        <td className="px-4 py-3">{formatDate(disposal.disposedAt)}</td>
                        <td className="px-4 py-3">{disposal.reason}</td>
                        <td className="px-4 py-3">{disposal.performedBy?.name ?? "-"}</td>
                        <td className="px-4 py-3"><ReverseDisposalButton disposalId={disposal.id} disabled={Boolean(disposal.reversedAt)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
