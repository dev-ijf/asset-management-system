import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createPersonInChargeAction,
  deletePersonInChargeAction,
  updatePersonInChargeAction,
} from "@/app/(dashboard)/dashboard/master/person-in-charge-actions";
import { MasterCreateAction, MasterRowActions, type MasterCrudRecord, type MasterField } from "@/components/master/master-crud-client";
import { DataTable } from "@/components/tables/data-table";
import { Pagination } from "@/components/tables/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginate, type PaginationQuery } from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";
import { wibFormat } from "@/lib/datetime";

import { FilterPanel } from "@/components/tables/filter-panel";
import { SelectFilterField } from "@/components/master/master-filter-fields";
import { activeFilterCount, type MasterParams } from "@/lib/master-filters";
type Props = {
  search?: string;
  paginationQuery: MasterParams;
};

const fields: MasterField[] = [
  { name: "name", label: "Name", placeholder: "Nama PIC", required: true },
  { name: "email", label: "Email", placeholder: "pic@example.com", type: "email" },
  { name: "phone", label: "Phone", placeholder: "08123456789", type: "tel" },
  { name: "notes", label: "Notes", placeholder: "Catatan singkat", type: "textarea" },
];

function formatDate(date: Date) {
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export async function PersonInChargePage({ search = "", paginationQuery }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const searchWhere: Prisma.PersonInChargeWhereInput | undefined = query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined;
    const nameOptions = (await prisma.personInCharge.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })).map((item) => ({ value: item.id, label: item.name }));
    const where: Prisma.PersonInChargeWhereInput = { AND: [searchWhere ?? {}, paginationQuery.name ? { id: paginationQuery.name } : {}] };
    const activeFilters = activeFilterCount(paginationQuery, ["name"]);
    const { items: people, pagination } = await paginate(paginationQuery,
      () => prisma.personInCharge.count({ where }),
      ({ skip, take }) => prisma.personInCharge.findMany({ where, skip, take, orderBy: [{ name: "asc" }],
      include: { _count: { select: { assets: true } } },
      }),
    );

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
          <CardHeader className="space-y-4">
            <CardTitle>Daftar PIC</CardTitle>
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={query}
                searchPlaceholder="Cari name, email, atau phone"
                activeCount={activeFilters}
                resetHref={query ? `/dashboard/master/person-in-charge?q=${encodeURIComponent(query)}` : "/dashboard/master/person-in-charge"}
              >
                <SelectFilterField label="Name" name="name" value={paginationQuery.name} allLabel="Semua" options={nameOptions} />
              </FilterPanel>
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
                    <span className="text-[var(--muted)]">{(pagination.page - 1) * pagination.pageSize + index + 1}</span>,
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
            <div className="mt-4"><Pagination {...pagination} /></div>
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
