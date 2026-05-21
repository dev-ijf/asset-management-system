import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { formatReportDate, formatReportMoney, getReportOptions, parseReportDate, requireReportsView } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function optionList(options: { id: string; label: string }[]) {
  return options.map((option) => (
    <option key={option.id} value={option.id}>
      {option.label}
    </option>
  ));
}

export default async function AssetReportPage({ searchParams }: PageProps) {
  await requireReportsView();
  const filters = await searchParams;
  const options = await getReportOptions();
  const query = new URLSearchParams();
  const from = parseReportDate(filters.from ?? null);
  const to = parseReportDate(filters.to ?? null);

  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      assetStatusId: filters.status || undefined,
      assetClassId: filters.class || undefined,
      assetCategoryId: filters.category || undefined,
      assetLocationId: filters.location || undefined,
      departmentId: filters.department || undefined,
      createdAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
    },
    include: {
      assetStatus: true,
      assetClass: true,
      assetCategory: true,
      assetLocation: true,
      department: true,
      personInCharge: true,
      assetUser: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Report Assets"
        subtitle="Ringkasan data aset aktif dengan filter master data."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/reports/assets/export?${query.toString()}`}><Button><Download className="h-4 w-4" />CSV</Button></Link>
            <Link href={`/dashboard/reports/export/excel?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />Excel</Button></Link>
            <Link href={`/dashboard/reports/export/pdf?${query.toString()}`}><Button variant="secondary"><Download className="h-4 w-4" />PDF</Button></Link>
          </div>
        }
      />
      <Card>
        <CardContent className="space-y-5">
          <form className="grid gap-4 md:grid-cols-5">
            <Select name="status" defaultValue={filters.status ?? ""}>
              <option value="">Semua Status</option>
              {optionList(options.statuses)}
            </Select>
            <Select name="class" defaultValue={filters.class ?? ""}>
              <option value="">Semua Class</option>
              {optionList(options.classes)}
            </Select>
            <Select name="category" defaultValue={filters.category ?? ""}>
              <option value="">Semua Category</option>
              {optionList(options.categories)}
            </Select>
            <Select name="location" defaultValue={filters.location ?? ""}>
              <option value="">Semua Location</option>
              {optionList(options.locations)}
            </Select>
            <Select name="department" defaultValue={filters.department ?? ""}>
              <option value="">Semua Department</option>
              {optionList(options.departments)}
            </Select>
            <Input name="from" type="date" defaultValue={filters.from ?? ""} />
            <Input name="to" type="date" defaultValue={filters.to ?? ""} />
            <div className="md:col-span-5 flex gap-2">
              <Button type="submit">Filter</Button>
              <Link href="/dashboard/reports/assets">
                <Button type="button" variant="secondary">Reset</Button>
              </Link>
            </div>
          </form>

          {assets.length === 0 ? (
            <EmptyState title="Tidak ada data asset." description="Ubah filter untuk melihat data report." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">PIC/User</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {assets.map((asset, index) => (
                    <tr key={asset.id}>
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold">{asset.code}</td>
                      <td className="px-4 py-3">{asset.name}</td>
                      <td className="px-4 py-3">{asset.assetStatus ? <Badge>{asset.assetStatus.name}</Badge> : "-"}</td>
                      <td className="px-4 py-3">{asset.assetClass?.name ?? "-"}</td>
                      <td className="px-4 py-3">{asset.assetCategory?.name ?? "-"}</td>
                      <td className="px-4 py-3">{asset.assetLocation?.name ?? "-"}</td>
                      <td className="px-4 py-3">{asset.department?.name ?? "-"}</td>
                      <td className="px-4 py-3">{asset.personInCharge?.name ?? asset.assetUser?.name ?? "-"}</td>
                      <td className="px-4 py-3">{formatReportMoney(asset.cost)}</td>
                      <td className="px-4 py-3">{formatReportDate(asset.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
