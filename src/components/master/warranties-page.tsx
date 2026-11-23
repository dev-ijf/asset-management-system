import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createWarrantyAction,
  deleteWarrantyAction,
  updateWarrantyAction,
} from "@/app/(dashboard)/dashboard/master/warranty-actions";
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
import type { Prisma } from "@/generated/prisma/client";
import { wibFormat } from "@/lib/datetime";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
type Props = {
  search?: string;
  paginationQuery: MasterParams;
};

const fields: MasterField[] = [
  { name: "name", label: "Name", placeholder: "Garansi 12 bulan", required: true },
  { name: "durationMonths", label: "Duration Months", placeholder: "12", required: true, type: "number" },
  { name: "notes", label: "Notes", placeholder: "Catatan garansi", type: "textarea" },
];

function formatDate(date: Date) {
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function WarrantiesPage({ search = "", paginationQuery }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.WarrantyWhereInput | undefined = query ? { name: { contains: query, mode: "insensitive" } } : undefined;
    const nameOptions = (await prisma.warranty.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.name }));
    const durationOptions = (await prisma.warranty.findMany({ distinct: ["durationMonths"], select: { durationMonths: true }, orderBy: { durationMonths: "asc" } })).map((item) => ({ value: String(item.durationMonths), label: `${item.durationMonths} bulan` }));
    const where: Prisma.WarrantyWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}, paginationQuery.duration ? { durationMonths: Number(paginationQuery.duration) || -1 } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name","duration"]);
    const { items: warranties, pagination } = await paginate(paginationQuery,
      () => prisma.warranty.count({ where }),
      ({ skip, take }) => prisma.warranty.findMany({ where, skip, take, orderBy: [{ name: "asc" }],
      include: { _count: { select: { assets: true } } },
      }),
    );

    return (
      <>
        <PageHeader
          title="Masa Garansi Aset"
          subtitle="Kelola informasi garansi, durasi, dan reminder klaim."
          actions={
            <MasterCreateAction
              action={createWarrantyAction}
              buttonLabel="Tambah Garansi"
              canManage={canManage}
              description="Buat data garansi baru."
              fields={fields}
              title="Tambah Garansi"
            />
          }
        />
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Garansi</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari name"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/warranties?q=${encodeURIComponent(query)}` : "/dashboard/master/warranties"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
                <SelectFilterField label="Duration Months" name="duration" value={paginationQuery.duration} allLabel="Semua" options={durationOptions} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {warranties.length === 0 ? (
              <EmptyState title={query ? "Data tidak ditemukan." : "Belum ada data garansi."} description={query ? "Coba gunakan kata kunci lain." : "Tambah garansi pertama untuk mulai mengelola durasi garansi."} />
            ) : (
              <DataTable
                columns={["No", "Name", "Duration Months", "Notes", "Created At", "Action"]}
                rows={warranties.map((warranty, index) => {
                  const record: MasterCrudRecord = {
                    id: warranty.id,
                    values: {
                      name: warranty.name,
                      durationMonths: warranty.durationMonths,
                      notes: warranty.notes,
                    },
                    assetCount: warranty._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                    warranty.name,
                    <span className="text-[var(--muted)]">{warranty.durationMonths}</span>,
                    <span className="text-[var(--muted)]">{warranty.notes ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(warranty.createdAt)}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deleteWarrantyAction}
                      deleteDescription={`Warranty "${warranty.name}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus Garansi"
                      editDescription="Perbarui nama, durasi, atau catatan garansi."
                      editFields={fields}
                      editTitle="Edit Garansi"
                      record={record}
                      updateAction={updateWarrantyAction}
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
        <PageHeader title="Masa Garansi Aset" subtitle="Kelola garansi aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data garansi gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
