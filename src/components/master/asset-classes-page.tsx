import { AlertCircle, Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import {
  createAssetClassAction,
  deleteAssetClassAction,
  updateAssetClassAction,
} from "@/app/(dashboard)/dashboard/master/asset-class-actions";
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
import { TEXT_LIMITS } from "@/lib/text-limits";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
type Props = {
  search?: string;
  paginationQuery: MasterParams;
};

const fields: MasterField[] = [
  { name: "code", label: "Code", placeholder: "PRM", required: true, maxLength: TEXT_LIMITS.code },
  { name: "name", label: "Name", placeholder: "Peralatan & Mesin", required: true },
  { name: "description", label: "Description", placeholder: "Deskripsi singkat kelas aset", type: "textarea" },
];

function formatDate(date: Date) {
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function AssetClassesPage({ search = "", paginationQuery }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.AssetClassWhereInput | undefined = query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined;
    const nameOptions = (await prisma.assetClass.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.name }));
    const where: Prisma.AssetClassWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name"]);
    const { items: classes, pagination } = await paginate(paginationQuery,
      () => prisma.assetClass.count({ where }),
      ({ skip, take }) => prisma.assetClass.findMany({ where, skip, take, orderBy: [{ code: "asc" }],
      include: { _count: { select: { assets: true } } },
      }),
    );

    return (
      <>
        <PageHeader
          title="Kelas Aset"
          subtitle="Kelompokkan aset berdasarkan kelas pengelolaan, prioritas, nilai, atau risiko operasional."
          actions={
            <MasterCreateAction
              action={createAssetClassAction}
              buttonLabel="Tambah Kelas"
              canManage={canManage}
              description="Buat kelas aset baru. Isi code singkat yang mudah dibaca, misalnya TNH, GDB, atau PRM."
              fields={fields}
              title="Tambah Kelas Aset"
            />
          }
        />
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Kelas Aset</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari code atau name"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/asset-classes?q=${encodeURIComponent(query)}` : "/dashboard/master/asset-classes"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <EmptyState title={query ? "Data tidak ditemukan." : "Belum ada data kelas aset."} description={query ? "Coba gunakan kata kunci lain untuk code atau name." : "Tambah kelas aset pertama untuk mulai mengelompokkan aset."} />
            ) : (
              <DataTable
                columns={["No", "Code", "Name", "Description", "Created At", "Action"]}
                rows={classes.map((assetClass, index) => {
                  const record: MasterCrudRecord = {
                    id: assetClass.id,
                    values: { code: assetClass.code, name: assetClass.name, description: assetClass.description },
                    assetCount: assetClass._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                    <span className="font-semibold">{assetClass.code}</span>,
                    assetClass.name,
                    <span className="text-[var(--muted)]">{assetClass.description ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(assetClass.createdAt)}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deleteAssetClassAction}
                      deleteDescription={`Kelas "${assetClass.name}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus Kelas Aset"
                      editDescription="Perbarui code, nama, atau deskripsi kelas aset. Aset yang memakai class ini tidak perlu diubah."
                      editFields={fields}
                      editTitle="Edit Kelas Aset"
                      record={record}
                      updateAction={updateAssetClassAction}
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
        <PageHeader title="Kelas Aset" subtitle="Kelola kelas aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data kelas aset gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
