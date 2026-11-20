import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { formatReportDate, getReportOptions, requireReportsView } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";
import { movementChangeText } from "@/lib/movement-display";
import { parseDateRange } from "@/lib/date-range";
import { DateRangeAlert, DateRangeInputs } from "@/components/ui/date-range-inputs";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<Record<string, string | undefined>> };

function options(items: { id: string; label: string }[]) {
  return items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>);
}

export default async function MovementReportPage({ searchParams }: PageProps) {
  await requireReportsView();
  const filters = await searchParams;
  const reportOptions = await getReportOptions();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const range = parseDateRange(filters.from, filters.to);

  const movements = range.error ? [] : await prisma.assetMovement.findMany({
    where: {
      assetId: filters.asset || undefined,
      fromLocationId: filters.fromLocation || undefined,
      toLocationId: filters.toLocation || undefined,
      performedAt: range.filter,
    },
    include: { asset: true, fromLocation: true, toLocation: true, fromDepartment: true, toDepartment: true, fromAssetUser: true, toAssetUser: true },
    orderBy: { performedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Report Movements" subtitle="Laporan perpindahan asset." actions={<div className="flex flex-wrap gap-2"><Link href={`/dashboard/reports/movements/export?${query.toString()}`}><Button><Download className="h-4 w-4" />CSV</Button></Link><Link href={`/dashboard/reports/export/excel?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />Excel</Button></Link><Link href={`/dashboard/reports/export/pdf?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />PDF</Button></Link></div>} />
      <Card>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-4">
            <Select name="asset" defaultValue={filters.asset ?? ""}><option value="">Semua Asset</option>{options(reportOptions.assets)}</Select>
            <Select name="fromLocation" defaultValue={filters.fromLocation ?? ""}><option value="">Semua From Location</option>{options(reportOptions.locations)}</Select>
            <Select name="toLocation" defaultValue={filters.toLocation ?? ""}><option value="">Semua To Location</option>{options(reportOptions.locations)}</Select>
            <DateRangeInputs from={filters.from} to={filters.to} />
            <div className="md:col-span-4 flex gap-2"><Button type="submit">Filter</Button><Link href="/dashboard/reports/movements"><Button type="button" variant="secondary">Reset</Button></Link></div>
          </form>
          {range.error ? <DateRangeAlert message={range.error} /> : movements.length === 0 ? <EmptyState title="Tidak ada data movement." description="Ubah filter untuk melihat report." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-xs">
                <thead className="whitespace-nowrap bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]"><tr><th className="px-3 py-2">No</th><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Department</th><th className="px-3 py-2">Asset User</th><th className="px-3 py-2">Performed At</th><th className="px-3 py-2">Notes</th></tr></thead>
                <tbody className="divide-y divide-[var(--border)]">{movements.map((movement, index) => <tr key={movement.id}><td className="px-3 py-2">{index + 1}</td><td className="px-3 py-2 font-medium">{movement.asset.code} - {movement.asset.name}</td><td className="px-3 py-2">{movementChangeText(movement.fromLocation, movement.toLocationId, movement.toLocation)}</td><td className="px-3 py-2">{movementChangeText(movement.fromDepartment, movement.toDepartmentId, movement.toDepartment)}</td><td className="px-3 py-2">{movementChangeText(movement.fromAssetUser, movement.toAssetUserId, movement.toAssetUser)}</td><td className="px-3 py-2">{formatReportDate(movement.performedAt)}</td><td className="px-3 py-2">{movement.notes ?? "-"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
