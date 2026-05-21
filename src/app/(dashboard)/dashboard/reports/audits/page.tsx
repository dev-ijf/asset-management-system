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

export default async function AuditReportPage({ searchParams }: PageProps) {
  await requireReportsView();
  const filters = await searchParams;
  const reportOptions = await getReportOptions();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const from = parseReportDate(filters.from ?? null);
  const to = parseReportDate(filters.to ?? null);

  const audits = await prisma.assetAudit.findMany({
    where: {
      assetId: filters.asset || undefined,
      status: filters.status ? (filters.status as "MATCHED" | "MISSING" | "DAMAGED" | "MATCH" | "MISMATCH") : undefined,
      auditedAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
    },
    include: { asset: true, location: true, auditedBy: { select: { name: true } } },
    orderBy: { auditedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Report Audits" subtitle="Laporan hasil audit fisik asset." actions={<div className="flex flex-wrap gap-2"><Link href={`/dashboard/reports/audits/export?${query.toString()}`}><Button><Download className="h-4 w-4" />CSV</Button></Link><Link href={`/dashboard/reports/export/excel?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />Excel</Button></Link><Link href={`/dashboard/reports/export/pdf?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />PDF</Button></Link></div>} />
      <Card>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-3">
            <Select name="asset" defaultValue={filters.asset ?? ""}><option value="">Semua Asset</option>{options(reportOptions.assets)}</Select>
            <Select name="status" defaultValue={filters.status ?? ""}><option value="">Semua Status</option><option value="MATCHED">MATCHED</option><option value="MISSING">MISSING</option><option value="DAMAGED">DAMAGED</option></Select>
            <Input name="from" type="date" defaultValue={filters.from ?? ""} />
            <Input name="to" type="date" defaultValue={filters.to ?? ""} />
            <div className="md:col-span-3 flex gap-2"><Button type="submit">Filter</Button><Link href="/dashboard/reports/audits"><Button type="button" variant="secondary">Reset</Button></Link></div>
          </form>
          {audits.length === 0 ? <EmptyState title="Tidak ada data audit." description="Ubah filter untuk melihat report." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Audited At</th><th className="px-4 py-3">Auditor</th><th className="px-4 py-3">Notes</th></tr></thead>
                <tbody className="divide-y divide-[var(--border)]">{audits.map((audit, index) => <tr key={audit.id}><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3 font-medium">{audit.asset.code} - {audit.asset.name}</td><td className="px-4 py-3"><Badge variant={audit.status === "MISSING" || audit.status === "DAMAGED" ? "danger" : "success"}>{audit.status}</Badge></td><td className="px-4 py-3">{audit.location?.name ?? "-"}</td><td className="px-4 py-3">{formatReportDate(audit.auditedAt)}</td><td className="px-4 py-3">{audit.auditedBy?.name ?? "-"}</td><td className="px-4 py-3">{audit.notes ?? "-"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
