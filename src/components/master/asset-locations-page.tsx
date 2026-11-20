import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  AssetLocationCreateAction,
  AssetLocationRowActions,
  type AssetLocationOption,
  type AssetLocationRow,
} from "@/components/master/asset-locations-client";
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
import { buildLocationTree } from "@/lib/location-tree";
import { wibFormat } from "@/lib/datetime";

type AssetLocationsPageProps = {
  search?: string;
  paginationQuery: PaginationQuery;
};

function formatDate(date: Date) {
  return wibFormat({
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function AssetLocationsPage({ search = "", paginationQuery }: AssetLocationsPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const all = await prisma.assetLocation.findMany({
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
    const tree = buildLocationTree(all);
    const needle = query.toLowerCase();
    const matches = needle
      ? tree.filter((item) => item.code.toLowerCase().includes(needle) || item.path.toLowerCase().includes(needle))
      : tree;
    const { page: requestedPage, pageSize } = parsePagination(paginationQuery);
    const pagination = createPagination(matches.length, requestedPage, pageSize);
    const { skip, take } = paginationQueryArgs(pagination);
    const byId = new Map(tree.map((item) => [item.id, item]));

    const parentOptions: AssetLocationOption[] = tree.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      path: item.path,
      depth: item.depth,
      subtreeIds: item.subtreeIds,
    }));

    const rows: AssetLocationRow[] = matches.slice(skip, skip + take).map((location) => {
      const parent = location.parentId ? byId.get(location.parentId) : undefined;
      return {
        id: location.id,
        code: location.code,
        name: location.name,
        depth: location.depth,
        path: location.path,
        parentId: location.parentId,
        parentName: parent ? `${parent.code} - ${parent.path}` : null,
        description: location.description,
        createdAt: formatDate(location.createdAt),
        assetCount: location._count.assets,
        childCount: location._count.children,
      };
    });

    return (
      <>
        <PageHeader
          title="Lokasi Aset"
          subtitle="Parent Location (misalnya gedung) memakai code yang Anda tentukan. Sub-lokasi otomatis memakai code parent-nya, misalnya GDA-01, sehingga dari code sudah terlihat induknya."
          actions={<AssetLocationCreateAction canManage={canManage} parentOptions={parentOptions} />}
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Lokasi Aset</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari code, name, atau path" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {query ? (
                <Link
                  href="/dashboard/master/asset-locations"
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
                title={query ? "Data tidak ditemukan." : "Belum ada data lokasi aset."}
                description={
                  query
                    ? "Coba gunakan kata kunci lain untuk code atau name."
                    : "Tambah lokasi aset pertama untuk mulai menyusun struktur lokasi."
                }
              />
            ) : (
              <DataTable
                columns={["No", "Code", "Name", "Parent Location", "Description", "Created At", "Action"]}
                rows={rows.map((location, index) => [
                  <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
                  <span className="font-semibold">{location.code}</span>,
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {location.name}
                    {location.parentId ? null : <Badge variant="primary">Parent Location</Badge>}
                  </span>,
                  <span className="text-[var(--muted)]">{location.parentName ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{location.description ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{location.createdAt}</span>,
                  <AssetLocationRowActions
                    location={location}
                    canManage={canManage}
                    parentOptions={parentOptions}
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
        <PageHeader title="Lokasi Aset" subtitle="Kelola lokasi fisik aset dan struktur penyimpanan." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data lokasi aset gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
