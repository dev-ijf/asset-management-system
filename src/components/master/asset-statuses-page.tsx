import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { AssetStatusCreateAction, AssetStatusRowActions, type AssetStatusRow } from "@/components/master/asset-statuses-client";
import { DataTable } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginate, type PaginationQuery } from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";
import { wibFormat } from "@/lib/datetime";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
type AssetStatusesPageProps = {
  search?: string;
  paginationQuery: MasterParams;
};

function formatDate(date: Date) {
  return wibFormat({
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function AssetStatusesPage({ search = "", paginationQuery }: AssetStatusesPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.AssetStatusWhereInput | undefined = query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined;
    const nameOptions = (await prisma.assetStatus.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.name }));
    const where: Prisma.AssetStatusWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name"]);
    const { items: statuses, pagination } = await paginate(paginationQuery,
      () => prisma.assetStatus.count({ where }),
      ({ skip, take }) => prisma.assetStatus.findMany({ where, skip, take, orderBy: [{ code: "asc" }],
      include: {
        _count: {
          select: { assets: true },
        },
      }, }),
    );

    const rows: AssetStatusRow[] = statuses.map((status) => ({
      id: status.id,
      code: status.code,
      name: status.name,
      description: status.description,
      createdAt: formatDate(status.createdAt),
      assetCount: status._count.assets,
    }));

    return (
      <>
        <PageHeader
          title="Status Aset"
          subtitle="Kelola status siklus hidup aset seperti aktif, maintenance, rusak, disposal, dan arsip."
          actions={<AssetStatusCreateAction canManage={canManage} />}
        />

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Status Aset</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari code atau name"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/asset-statuses?q=${encodeURIComponent(query)}` : "/dashboard/master/asset-statuses"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState
                title={query ? "Data tidak ditemukan." : "Belum ada data status aset."}
                description={
                  query
                    ? "Coba gunakan kata kunci lain untuk code atau name."
                    : "Tambah status aset pertama untuk mulai mengelola siklus hidup aset."
                }
              />
            ) : (
              <DataTable
                columns={["No", "Code", "Name", "Description", "Created At", "Action"]}
                rows={rows.map((status, index) => [
                  <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                  <span className="font-semibold">{status.code}</span>,
                  status.name,
                  <span className="text-[var(--muted)]">{status.description ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{status.createdAt}</span>,
                  <AssetStatusRowActions status={status} canManage={canManage} />,
                ])}
              />
            )}
            <div className="mt-4"><Pagination {...pagination} /></div>
          </CardContent>
        </Card>
      </>
    );
  } catch {
    return (
      <>
        <PageHeader title="Status Aset" subtitle="Kelola status siklus hidup aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data status aset gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
