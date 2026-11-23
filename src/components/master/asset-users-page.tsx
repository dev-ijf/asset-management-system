import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createAssetUserAction,
  deleteAssetUserAction,
  updateAssetUserAction,
} from "@/app/(dashboard)/dashboard/master/asset-user-actions";
import { MasterCreateAction, MasterRowActions, type MasterCrudRecord, type MasterField } from "@/components/master/master-crud-client";
import { DataTable } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { locationOptions } from "@/lib/location-tree";
import { paginate, type PaginationQuery } from "@/lib/pagination";
import { wibFormat } from "@/lib/datetime";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
import { locationPathOptions } from "@/lib/location-tree";
type Props = {
  search?: string;
  paginationQuery: MasterParams;
};

function formatDate(date: Date) {
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function AssetUsersPage({ search = "", paginationQuery }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.AssetUserWhereInput | undefined = query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined;
    const nameOptions = (await prisma.assetUser.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.name }));
    const where: Prisma.AssetUserWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}, paginationQuery.department === "none" ? { departmentId: null } : paginationQuery.department ? { departmentId: paginationQuery.department } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name","department"]);
    const [{ items: assetUsers, pagination }, departments] = await Promise.all([
      paginate(paginationQuery,
        () => prisma.assetUser.count({ where }),
        ({ skip, take }) => prisma.assetUser.findMany({ where, skip, take, orderBy: [{ name: "asc" }],
        include: {
          department: { select: { id: true, code: true, name: true } },
          _count: { select: { assets: true } },
        }, }),
      ),
      prisma.department.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
    ]);

    const fields: MasterField[] = [
      { name: "name", label: "Name", placeholder: "Nama pengguna aset", required: true },
      { name: "email", label: "Email", placeholder: "user@example.com", type: "email" },
      { name: "phone", label: "Phone", placeholder: "08123456789", type: "tel" },
      {
        name: "departmentId",
        label: "Department",
        type: "select",
        options: [
          { label: "Tidak ada department", value: "" },
          ...locationOptions(departments).map((department) => ({ label: department.label, value: department.id })),
        ],
      },
      { name: "notes", label: "Notes", placeholder: "Catatan singkat", type: "textarea" },
    ];

    return (
      <>
        <PageHeader
          title="Pengguna Aset"
          subtitle="Kelola pengguna akhir aset untuk peminjaman, movement, dan histori penggunaan."
          actions={
            <MasterCreateAction
              action={createAssetUserAction}
              buttonLabel="Tambah Pengguna"
              canManage={canManage}
              description="Buat data pengguna aset baru."
              fields={fields}
              title="Tambah Pengguna Aset"
            />
          }
        />
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Pengguna Aset</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari name, email, atau phone"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/asset-users?q=${encodeURIComponent(query)}` : "/dashboard/master/asset-users"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
                <SelectFilterField label="Department" name="department" value={paginationQuery.department} allLabel="Semua" options={[{ value: "none", label: "Tanpa department" }, ...locationPathOptions(departments).map((option) => ({ value: option.id, label: option.label }))]} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {assetUsers.length === 0 ? (
              <EmptyState title={query ? "Data tidak ditemukan." : "Belum ada data pengguna aset."} description={query ? "Coba gunakan kata kunci lain." : "Tambah pengguna aset pertama untuk mulai mengelola pemakai aset."} />
            ) : (
              <DataTable
                columns={["No", "Name", "Email", "Phone", "Department", "Created At", "Action"]}
                rows={assetUsers.map((assetUser, index) => {
                  const record: MasterCrudRecord = {
                    id: assetUser.id,
                    values: {
                      name: assetUser.name,
                      email: assetUser.email,
                      phone: assetUser.phone,
                      departmentId: assetUser.departmentId,
                      notes: assetUser.notes,
                    },
                    assetCount: assetUser._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                    assetUser.name,
                    <span className="text-[var(--muted)]">{assetUser.email ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{assetUser.phone ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{assetUser.department ? `${assetUser.department.code} - ${assetUser.department.name}` : "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(assetUser.createdAt)}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deleteAssetUserAction}
                      deleteDescription={`Pengguna "${assetUser.name}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus Pengguna Aset"
                      editDescription="Perbarui data pengguna aset."
                      editFields={fields}
                      editTitle="Edit Pengguna Aset"
                      record={record}
                      updateAction={updateAssetUserAction}
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
        <PageHeader title="Pengguna Aset" subtitle="Kelola pengguna aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data pengguna aset gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
