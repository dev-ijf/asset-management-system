import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createAssetUserAction,
  deleteAssetUserAction,
  updateAssetUserAction,
} from "@/app/(dashboard)/dashboard/master/asset-user-actions";
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function AssetUsersPage({ search = "" }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const [assetUsers, departments] = await Promise.all([
      prisma.assetUser.findMany({
        where: query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: [{ name: "asc" }],
        include: {
          department: { select: { id: true, code: true, name: true } },
          _count: { select: { assets: true } },
        },
      }),
      prisma.department.findMany({
        orderBy: [{ code: "asc" }],
        select: { id: true, code: true, name: true },
      }),
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
          ...departments.map((department) => ({
            label: `${department.code} - ${department.name}`,
            value: department.id,
          })),
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
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Pengguna Aset</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari name, email, atau phone" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              {query ? <Link href="/dashboard/master/asset-users" className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]">Reset</Link> : null}
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
                    <span className="text-[var(--muted)]">{index + 1}</span>,
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
