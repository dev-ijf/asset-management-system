import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { formatReportDate, getReportOptions, parseReportDate, requireReportsView } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<Record<string, string | undefined>> };

function options(items: { id: string; label: string }[]) {
  return items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>);
}

export default async function DisposalReportPage({ searchParams }: PageProps) {
  await requireReportsView();
  const filters = await searchParams;
  const reportOptions = await getReportOptions();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const from = parseReportDate(filters.from ?? null);
  const to = parseReportDate(filters.to ?? null);

  const disposals = await prisma.assetDisposal.findMany({
    where: {
      assetId: filters.asset || undefined,
      disposedAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
      reversedAt: filters.status === "reversed" ? { not: null } : filters.status === "disposed" ? null : undefined,
    },
    include: { asset: true, previousStatus: true, disposedStatus: true, performedBy: { select: { name: true } }, reversedBy: { select: { name: true } } },
    orderBy: { disposedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Report Disposals" subtitle="Laporan disposal dan reverse asset." actions={<div className="flex flex-wrap gap-2"><Link href={`/dashboard/reports/disposals/export?${query.toString()}`}><Button><Download className="h-4 w-4" />CSV</Button></Link><Link href={`/dashboard/reports/export/excel?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />Excel</Button></Link><Link href={`/dashboard/reports/export/pdf?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />PDF</Button></Link></div>} />
      <Card>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-3">
            <Select name="asset" defaultValue={filters.asset ?? ""}><option value="">Semua Asset</option>{options(reportOptions.assets)}</Select>
            <Select name="status" defaultValue={filters.status ?? ""}><option value="">Semua Status</option><option value="disposed">Disposed</option><option value="reversed">Reversed</option></Select>
            <Input name="from" type="date" defaultValue={filters.from ?? ""} />
            <Input name="to" type="date" defaultValue={filters.to ?? ""} />
            <div className="md:col-span-3 flex gap-2"><Button type="submit">Filter</Button><Link href="/dashboard/reports/disposals"><Button type="button" variant="secondary">Reset</Button></Link></div>
          </form>
          {disposals.length === 0 ? <EmptyState title="Tidak ada data disposal." description="Ubah filter untuk melihat report." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Disposed At</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Performed By</th><th className="px-4 py-3">Reversed By</th></tr></thead>
                <tbody className="divide-y divide-[var(--border)]">{disposals.map((disposal, index) => <tr key={disposal.id}><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3 font-medium">{disposal.asset.code} - {disposal.asset.name}</td><td className="px-4 py-3">{disposal.reversedAt ? <Badge variant="warning">Reversed</Badge> : <Badge variant="danger">Disposed</Badge>}</td><td className="px-4 py-3">{formatReportDate(disposal.disposedAt)}</td><td className="px-4 py-3">{disposal.reason}</td><td className="px-4 py-3">{disposal.performedBy?.name ?? "-"}</td><td className="px-4 py-3">{disposal.reversedBy?.name ?? "-"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
