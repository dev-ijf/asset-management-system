import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createAssetClassAction,
  deleteAssetClassAction,
  updateAssetClassAction,
} from "@/app/(dashboard)/dashboard/master/asset-class-actions";
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
  { name: "name", label: "Name", placeholder: "Kelas aset", required: true },
  { name: "description", label: "Description", placeholder: "Deskripsi singkat kelas aset", type: "textarea" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function AssetClassesPage({ search = "" }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const classes = await prisma.assetClass.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ code: "asc" }],
      include: { _count: { select: { assets: true } } },
    });

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
              description="Buat kelas aset baru. Code dibuat otomatis oleh sistem."
              fields={fields}
              title="Tambah Kelas Aset"
            />
          }
        />
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Kelas Aset</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari code atau name" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              {query ? <Link href="/dashboard/master/asset-classes" className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]">Reset</Link> : null}
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
                    values: { name: assetClass.name, description: assetClass.description },
                    assetCount: assetClass._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{index + 1}</span>,
                    <span className="font-semibold">{assetClass.code}</span>,
                    assetClass.name,
                    <span className="text-[var(--muted)]">{assetClass.description ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(assetClass.createdAt)}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deleteAssetClassAction}
                      deleteDescription={`Kelas "${assetClass.name}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus Kelas Aset"
                      editDescription="Perbarui nama atau deskripsi kelas aset."
                      editFields={fields}
                      editTitle="Edit Kelas Aset"
                      record={record}
                      updateAction={updateAssetClassAction}
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
