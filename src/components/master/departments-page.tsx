import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { DepartmentCreateAction, DepartmentRowActions } from "@/components/master/departments-client";
import type { HierarchyOption, HierarchyRow } from "@/components/master/hierarchy-master-client";
import { DataTable } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPagination, paginationQuery as paginationQueryArgs, parsePagination, type PaginationQuery } from "@/lib/pagination";
import { buildLocationTree as buildHierarchy } from "@/lib/location-tree";
import { wibFormat } from "@/lib/datetime";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
type DepartmentsPageProps = {
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

export async function DepartmentsPage({ search = "", paginationQuery }: DepartmentsPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const all = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        parentId: true,
        createdAt: true,
        _count: { select: { assets: true, children: true } },
      },
    });
    const tree = buildHierarchy(all);
    const needle = query.toLowerCase();
    const matches = needle
      ? tree.filter((item) => item.code.toLowerCase().includes(needle) || item.path.toLowerCase().includes(needle))
      : tree;
    // Column filters: Name and the direct parent shown in the "Parent Department" column.
    const filtered = matches.filter((item) =>
      (!paginationQuery.name || item.id === paginationQuery.name) &&
      (paginationQuery.parent === "none" ? !item.parentId : paginationQuery.parent ? item.parentId === paginationQuery.parent : true),
    );
    const activeFilters = activeFilterCount(paginationQuery, ["name", "parent"]);
    const { page: requestedPage, pageSize } = parsePagination(paginationQuery);
    const pagination = createPagination(filtered.length, requestedPage, pageSize);
    const { skip, take } = paginationQueryArgs(pagination);
    const byId = new Map(tree.map((item) => [item.id, item]));

    const parentOptions: HierarchyOption[] = tree.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      path: item.path,
      depth: item.depth,
      subtreeIds: item.subtreeIds,
    }));

    const rows: HierarchyRow[] = filtered.slice(skip, skip + take).map((department) => {
      const parent = department.parentId ? byId.get(department.parentId) : undefined;
      return {
        id: department.id,
        code: department.code,
        name: department.name,
        depth: department.depth,
        path: department.path,
        parentId: department.parentId,
        parentName: parent ? `${parent.code} - ${parent.path}` : null,
        description: department.description,
        createdAt: formatDate(department.createdAt),
        assetCount: department._count.assets,
        childCount: department._count.children,
      };
    });

    return (
      <>
        <PageHeader
          title="Departemen"
          subtitle="Parent Department (misalnya Sekolah) memakai code yang Anda tentukan. Sub-departemen (misalnya Teacher, Kepala Sekolah) otomatis memakai code parent-nya, misalnya SKL-01."
          actions={<DepartmentCreateAction canManage={canManage} options={parentOptions} />}
        />

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Departemen</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari code, name, atau path"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/departments?q=${encodeURIComponent(query)}` : "/dashboard/master/departments"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={parentOptions.map((option) => ({ value: option.id, label: option.path }))} />
                <SelectFilterField label="Parent Department" name="parent" value={paginationQuery.parent} allLabel="Semua" options={[{ value: "none", label: "Tanpa parent (Parent Department)" }, ...parentOptions.filter((option) => option.subtreeIds.length > 1).map((option) => ({ value: option.id, label: option.path }))]} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState
                title={query ? "Data tidak ditemukan." : "Belum ada data departemen."}
                description={
                  query
                    ? "Coba gunakan kata kunci lain untuk code atau name."
                    : "Tambah departemen pertama, lalu tambahkan sub-departemennya."
                }
              />
            ) : (
              <DataTable
                columns={["No", "Code", "Name", "Parent Department", "Description", "Created At", "Action"]}
                rows={rows.map((department, index) => [
                  <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                  <span className="font-semibold">{department.code}</span>,
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {department.name}
                    {department.parentId ? null : <Badge variant="primary">Parent Department</Badge>}
                  </span>,
                  <span className="text-[var(--muted)]">{department.parentName ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{department.description ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{department.createdAt}</span>,
                  <DepartmentRowActions record={department} canManage={canManage} options={parentOptions} />,
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
        <PageHeader title="Departemen" subtitle="Kelola departemen dan sub-departemen." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data departemen gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
