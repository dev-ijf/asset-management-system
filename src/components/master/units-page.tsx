import { AlertCircle, Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { createUnitAction, deleteUnitAction, updateUnitAction } from "@/app/(dashboard)/dashboard/master/unit-actions";
import { MasterCreateAction, MasterRowActions, type MasterCrudRecord, type MasterField } from "@/components/master/master-crud-client";
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
import { wibFormat } from "@/lib/datetime";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
type Props = {
  search?: string;
  paginationQuery: MasterParams;
};

const fields: MasterField[] = [
  { name: "name", label: "Name", placeholder: "Pieces", required: true },
  { name: "description", label: "Description", placeholder: "Deskripsi singkat unit", type: "textarea" },
];

function formatDate(date: Date) {
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function UnitsPage({ search = "", paginationQuery }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.UnitWhereInput | undefined = query
        ? {
            OR: [
              { symbol: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined;
    const nameOptions = (await prisma.unit.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.name }));
    const where: Prisma.UnitWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name"]);
    const { items: units, pagination } = await paginate(paginationQuery,
      () => prisma.unit.count({ where }),
      ({ skip, take }) => prisma.unit.findMany({ where, skip, take, orderBy: [{ symbol: "asc" }],
      include: { _count: { select: { assets: true } } },
      }),
    );

    return (
      <>
        <PageHeader
          title="Satuan Unit Aset"
          subtitle="Kelola satuan aset untuk stok, consumable, dan item inventaris."
          actions={
            <MasterCreateAction
              action={createUnitAction}
              buttonLabel="Tambah Unit"
              canManage={canManage}
              description="Buat satuan unit baru. Symbol dibuat otomatis oleh sistem."
              fields={fields}
              title="Tambah Unit"
            />
          }
        />
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Unit</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari symbol atau name"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/units?q=${encodeURIComponent(query)}` : "/dashboard/master/units"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <EmptyState title={query ? "Data tidak ditemukan." : "Belum ada data unit."} description={query ? "Coba gunakan kata kunci lain untuk symbol atau name." : "Tambah unit pertama untuk mulai mengelola satuan aset."} />
            ) : (
              <DataTable
                columns={["No", "Symbol", "Name", "Description", "Created At", "Action"]}
                rows={units.map((unit, index) => {
                  const record: MasterCrudRecord = {
                    id: unit.id,
                    values: { name: unit.name, description: unit.description },
                    assetCount: unit._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                    <span className="font-semibold">{unit.symbol}</span>,
                    unit.name,
                    <span className="text-[var(--muted)]">{unit.description ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(unit.createdAt)}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deleteUnitAction}
                      deleteDescription={`Unit "${unit.name}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus Unit"
                      editDescription="Perbarui nama atau deskripsi unit."
                      editFields={fields}
                      editTitle="Edit Unit"
                      record={record}
                      updateAction={updateUnitAction}
                    />,
                  ];
                })}
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
        <PageHeader title="Satuan Unit Aset" subtitle="Kelola satuan aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data unit gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
