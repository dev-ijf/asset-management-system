import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  AssetCategoryCreateAction,
  AssetCategoryRowActions,
  type AssetCategoryOption,
  type AssetCategoryRow,
} from "@/components/master/asset-categories-client";
import { DataTable } from "@/components/tables/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AssetCategoriesPageProps = {
  search?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function AssetCategoriesPage({ search = "" }: AssetCategoriesPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const [categories, parentOptionsData] = await Promise.all([
      prisma.assetCategory.findMany({
        where: query
          ? {
              OR: [
                { code: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: [{ code: "asc" }],
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
        },
      }),
      prisma.assetCategory.findMany({
        orderBy: [{ code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
    ]);

    const parentOptions: AssetCategoryOption[] = parentOptionsData.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
    }));

    const rows: AssetCategoryRow[] = categories.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
      parentId: category.parentId,
      parentName: category.parent ? `${category.parent.code} - ${category.parent.name}` : null,
      description: category.description,
      createdAt: formatDate(category.createdAt),
      assetCount: category._count.assets,
      childCount: category._count.children,
    }));

    return (
      <>
        <PageHeader
          title="Kategori Aset"
          subtitle="Kelola kategori aset untuk struktur inventaris, penomoran, dan laporan."
          actions={<AssetCategoryCreateAction canManage={canManage} parentOptions={parentOptions} />}
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Kategori Aset</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari code atau name" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {query ? (
                <Link
                  href="/dashboard/master/asset-categories"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                >
                  Reset
                </Link>
              ) : null}
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
                columns={["No", "Code", "Name", "Parent Category", "Description", "Created At", "Action"]}
                rows={rows.map((category, index) => [
                  <span className="text-[var(--muted)]">{index + 1}</span>,
                  <span className="font-semibold">{category.code}</span>,
                  category.name,
                  <span className="text-[var(--muted)]">{category.parentName ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{category.description ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{category.createdAt}</span>,
                  <AssetCategoryRowActions
                    category={category}
                    canManage={canManage}
                    parentOptions={parentOptions}
                  />,
                ])}
              />
            )}
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
