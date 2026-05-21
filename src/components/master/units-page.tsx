import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { createUnitAction, deleteUnitAction, updateUnitAction } from "@/app/(dashboard)/dashboard/master/unit-actions";
import { MasterCreateAction, MasterRowActions, type MasterCrudRecord, type MasterField } from "@/components/master/master-crud-client";
import { DataTable } from "@/components/tables/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  search?: string;
};

const fields: MasterField[] = [
  { name: "name", label: "Name", placeholder: "Pieces", required: true },
  { name: "description", label: "Description", placeholder: "Deskripsi singkat unit", type: "textarea" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function UnitsPage({ search = "" }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const units = await prisma.unit.findMany({
      where: query
        ? {
            OR: [
              { symbol: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ symbol: "asc" }],
      include: { _count: { select: { assets: true } } },
    });

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
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Unit</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari symbol atau name" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              {query ? <Link href="/dashboard/master/units" className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]">Reset</Link> : null}
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
                    <span className="text-[var(--muted)]">{index + 1}</span>,
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
