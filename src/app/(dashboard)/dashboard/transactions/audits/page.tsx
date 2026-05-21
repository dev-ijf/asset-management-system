import { AuditForm } from "@/components/transactions/transaction-forms";
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

export default async function AuditsPage({ searchParams }: PageProps) {
  await requireAnyPermission(["reports.view", "audits.manage"]);
  const { q = "" } = await searchParams;
  const options = await getTransactionOptions();

  const audits = await prisma.assetAudit.findMany({
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
      location: true,
      auditedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Audit Aset" subtitle="Catat hasil audit fisik asset." />
      <div className="space-y-5">
        <AuditForm assets={options.assets} locations={options.locations} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <Input name="q" defaultValue={q} placeholder="Search asset code/name..." />
            </form>
            {audits.length === 0 ? (
              <EmptyState title="Belum ada data audit." description="Audit yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Audited At</th>
                      <th className="px-4 py-3">Auditor</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {audits.map((audit, index) => (
                      <tr key={audit.id}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{audit.asset.code} - {audit.asset.name}</td>
                        <td className="px-4 py-3"><Badge variant={audit.status === "MISSING" || audit.status === "DAMAGED" ? "danger" : "success"}>{audit.status}</Badge></td>
                        <td className="px-4 py-3">{audit.location ? `${audit.location.code} - ${audit.location.name}` : "-"}</td>
                        <td className="px-4 py-3">{formatDate(audit.auditedAt)}</td>
                        <td className="px-4 py-3">{audit.auditedBy?.name ?? "-"}</td>
                        <td className="px-4 py-3">{audit.notes ?? "-"}</td>
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
