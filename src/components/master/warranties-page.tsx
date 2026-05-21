import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createWarrantyAction,
  deleteWarrantyAction,
  updateWarrantyAction,
} from "@/app/(dashboard)/dashboard/master/warranty-actions";
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
  { name: "name", label: "Name", placeholder: "Garansi 12 bulan", required: true },
  { name: "durationMonths", label: "Duration Months", placeholder: "12", required: true, type: "number" },
  { name: "notes", label: "Notes", placeholder: "Catatan garansi", type: "textarea" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function WarrantiesPage({ search = "" }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const warranties = await prisma.warranty.findMany({
      where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
      orderBy: [{ name: "asc" }],
      include: { _count: { select: { assets: true } } },
    });

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
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Garansi</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari name" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              {query ? <Link href="/dashboard/master/warranties" className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]">Reset</Link> : null}
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
                    <span className="text-[var(--muted)]">{index + 1}</span>,
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
