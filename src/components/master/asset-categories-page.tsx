import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  AssetCategoryCreateAction,
  AssetCategoryRowActions,
  type AssetCategoryOption,
  type AssetCategoryRow,
} from "@/components/master/asset-categories-client";
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
import { paginate, type PaginationQuery } from "@/lib/pagination";
import { wibFormat } from "@/lib/datetime";
import { categoryClassResolver } from "@/lib/category-class";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams, categoryIdsOfClass } from "@/lib/master-filters";
type AssetCategoriesPageProps = {
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

export async function AssetCategoriesPage({ search = "", paginationQuery }: AssetCategoriesPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.AssetCategoryWhereInput | undefined = query
          ? {
              OR: [
                { code: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined;
    const nameOptions = (await prisma.assetCategory.findMany({ select: { id: true, name: true, parent: { select: { name: true } } }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.parent ? `${item.name} (${item.parent.name})` : item.name }));
    const where: Prisma.AssetCategoryWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}, paginationQuery.parent === "none" ? { parentId: null } : paginationQuery.parent ? { parentId: paginationQuery.parent } : {}, paginationQuery.class ? { id: { in: await categoryIdsOfClass(paginationQuery.class) } } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name","parent","class"]);
    const [{ items: categories, pagination }, parentOptionsData, classes] = await Promise.all([
      paginate(paginationQuery,
        () => prisma.assetCategory.count({ where }),
        ({ skip, take }) => prisma.assetCategory.findMany({ where, skip, take, orderBy: [{ code: "asc" }],
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              assets: true,
              children: true,
            },
          },
        }, }),
      ),
      prisma.assetCategory.findMany({
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          parentId: true,
          assetClassId: true,
        },
      }),
      prisma.assetClass.findMany({ orderBy: [{ code: "asc" }], select: { id: true, code: true, name: true } }),
    ]);
    const classOf = categoryClassResolver(parentOptionsData);
    const classLabels = new Map(classes.map((item) => [item.id, `${item.code} - ${item.name}`]));
    const classLabel = (categoryId: string) => {
      const classId = classOf(categoryId);
      return classId ? classLabels.get(classId) ?? null : null;
    };
    const classOptions: AssetCategoryOption[] = classes;

    const parentOptions: AssetCategoryOption[] = parentOptionsData.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
      classLabel: classLabel(category.id),
    }));

    const rows: AssetCategoryRow[] = categories.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
      parentId: category.parentId,
      parentName: category.parent ? `${category.parent.code} - ${category.parent.name}` : null,
      assetClassId: category.assetClassId,
      classLabel: classLabel(category.id),
      description: category.description,
      createdAt: formatDate(category.createdAt),
      assetCount: category._count.assets,
      childCount: category._count.children,
    }));

    return (
      <>
        <PageHeader
          title="Kategori Aset"
          subtitle="Kelola kategori aset untuk struktur inventaris, penomoran, dan laporan. Class diisi di kategori teratas; sub-kategori dan asetnya otomatis mengikuti."
          actions={<AssetCategoryCreateAction canManage={canManage} parentOptions={parentOptions} classOptions={classOptions} />}
        />

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Kategori Aset</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari code atau name"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/asset-categories?q=${encodeURIComponent(query)}` : "/dashboard/master/asset-categories"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
                <SelectFilterField label="Parent Category" name="parent" value={paginationQuery.parent} allLabel="Semua" options={[{ value: "none", label: "Tanpa parent" }, ...parentOptionsData.filter((item) => parentOptionsData.some((child) => child.parentId === item.id)).map((item) => ({ value: item.id, label: item.name }))]} />
                <SelectFilterField label="Class" name="class" value={paginationQuery.class} allLabel="Semua" options={[...classes].sort((a, b) => a.name.localeCompare(b.name, "id")).map((item) => ({ value: item.id, label: item.name }))} />
              </FilterPanel>
            </form>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState
                title={query ? "Data tidak ditemukan." : "Belum ada data kategori aset."}
                description={
                  query
                    ? "Coba gunakan kata kunci lain untuk code atau name."
                    : "Tambah kategori aset pertama untuk mulai menyusun struktur inventaris."
                }
              />
            ) : (
              <DataTable
                columns={["No", "Code", "Name", "Parent Category", "Class", "Description", "Created At", "Action"]}
                rows={rows.map((category, index) => [
                  <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                  <span className="font-semibold">{category.code}</span>,
                  category.name,
                  <span className="text-[var(--muted)]">{category.parentName ?? "-"}</span>,
                  category.classLabel ? (
                    <span>
                      {category.classLabel}
                      {category.parentId ? <span className="block text-[var(--muted)]">mengikuti parent</span> : null}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">Belum dipasangkan</span>
                  ),
                  <span className="text-[var(--muted)]">{category.description ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{category.createdAt}</span>,
                  <AssetCategoryRowActions
                    category={category}
                    canManage={canManage}
                    parentOptions={parentOptions}
                    classOptions={classOptions}
                  />,
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
        <PageHeader title="Kategori Aset" subtitle="Kelola kategori aset untuk struktur inventaris dan laporan." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data kategori aset gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
