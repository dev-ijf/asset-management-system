import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { AssetStatusCreateAction, AssetStatusRowActions, type AssetStatusRow } from "@/components/master/asset-statuses-client";
import { DataTable } from "@/components/tables/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AssetStatusesPageProps = {
  search?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function AssetStatusesPage({ search = "" }: AssetStatusesPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const statuses = await prisma.assetStatus.findMany({
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
        _count: {
          select: { assets: true },
        },
      },
    });

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
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Status Aset</CardTitle>
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
                  href="/dashboard/master/asset-statuses"
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
                  <span className="text-[var(--muted)]">{index + 1}</span>,
                  <span className="font-semibold">{status.code}</span>,
                  status.name,
                  <span className="text-[var(--muted)]">{status.description ?? "-"}</span>,
                  <span className="text-[var(--muted)]">{status.createdAt}</span>,
                  <AssetStatusRowActions status={status} canManage={canManage} />,
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
