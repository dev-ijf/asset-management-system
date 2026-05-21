import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createPersonInChargeAction,
  deletePersonInChargeAction,
  updatePersonInChargeAction,
} from "@/app/(dashboard)/dashboard/master/person-in-charge-actions";
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
  { name: "name", label: "Name", placeholder: "Nama PIC", required: true },
  { name: "email", label: "Email", placeholder: "pic@example.com", type: "email" },
  { name: "phone", label: "Phone", placeholder: "08123456789", type: "tel" },
  { name: "notes", label: "Notes", placeholder: "Catatan singkat", type: "textarea" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function PersonInChargePage({ search = "" }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const people = await prisma.personInCharge.findMany({
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
      include: { _count: { select: { assets: true } } },
    });

    return (
      <>
        <PageHeader
          title="Penanggung Jawab Aset"
          subtitle="Kelola PIC untuk audit, movement, maintenance, dan eskalasi aset bermasalah."
          actions={
            <MasterCreateAction
              action={createPersonInChargeAction}
              buttonLabel="Tambah PIC"
              canManage={canManage}
              description="Buat data penanggung jawab aset baru."
              fields={fields}
              title="Tambah PIC"
            />
          }
        />
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar PIC</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari name, email, atau phone" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              {query ? <Link href="/dashboard/master/person-in-charge" className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]">Reset</Link> : null}
            </form>
          </CardHeader>
          <CardContent>
            {people.length === 0 ? (
              <EmptyState title={query ? "Data tidak ditemukan." : "Belum ada data PIC."} description={query ? "Coba gunakan kata kunci lain." : "Tambah PIC pertama untuk mulai mengelola tanggung jawab aset."} />
            ) : (
              <DataTable
                columns={["No", "Name", "Email", "Phone", "Notes", "Created At", "Action"]}
                rows={people.map((person, index) => {
                  const record: MasterCrudRecord = {
                    id: person.id,
                    values: { name: person.name, email: person.email, phone: person.phone, notes: person.notes },
                    assetCount: person._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{index + 1}</span>,
                    person.name,
                    <span className="text-[var(--muted)]">{person.email ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{person.phone ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{person.notes ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(person.createdAt)}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deletePersonInChargeAction}
                      deleteDescription={`PIC "${person.name}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus PIC"
                      editDescription="Perbarui nama, kontak, atau catatan PIC."
                      editFields={fields}
                      editTitle="Edit PIC"
                      record={record}
                      updateAction={updatePersonInChargeAction}
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
        <PageHeader title="Penanggung Jawab Aset" subtitle="Kelola PIC aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data PIC gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
