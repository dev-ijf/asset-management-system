import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  createVendorContractAction,
  deleteVendorContractAction,
  updateVendorContractAction,
} from "@/app/(dashboard)/dashboard/master/vendor-contract-actions";
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
  { name: "vendorName", label: "Vendor Name", placeholder: "Nama vendor", required: true },
  { name: "contractNumber", label: "Contract Number", placeholder: "CTR-001" },
  { name: "startDate", label: "Start Date", type: "date" },
  { name: "endDate", label: "End Date", type: "date" },
  { name: "slaResponseHours", label: "SLA Response Hours", placeholder: "4", type: "number" },
  { name: "slaResolutionHours", label: "SLA Resolution Hours", placeholder: "24", type: "number" },
  { name: "notes", label: "Notes", placeholder: "Catatan kontrak", type: "textarea" },
];

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export async function VendorContractsPage({ search = "" }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const query = search.trim();

  try {
    const contracts = await prisma.vendorContract.findMany({
      where: query
        ? {
            OR: [
              { vendorName: { contains: query, mode: "insensitive" } },
              { contractNumber: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ vendorName: "asc" }],
      include: { _count: { select: { assets: true } } },
    });

    return (
      <>
        <PageHeader
          title="Vendor & Kontrak Aset"
          subtitle="Kelola vendor, nomor kontrak, periode kontrak, SLA, dan catatan layanan."
          actions={
            <MasterCreateAction
              action={createVendorContractAction}
              buttonLabel="Tambah Kontrak"
              canManage={canManage}
              description="Buat data vendor atau kontrak baru."
              fields={fields}
              title="Tambah Vendor Contract"
            />
          }
        />
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Daftar Vendor Contract</CardTitle>
            <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-lg">
              <div className="relative flex-1">
                <Input name="q" placeholder="Cari vendor atau contract number" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
              {query ? <Link href="/dashboard/master/vendor-contracts" className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-transparent px-5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]">Reset</Link> : null}
            </form>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <EmptyState title={query ? "Data tidak ditemukan." : "Belum ada data vendor contract."} description={query ? "Coba gunakan kata kunci lain." : "Tambah vendor contract pertama untuk mulai mengelola kontrak aset."} />
            ) : (
              <DataTable
                columns={["No", "Vendor", "Contract No", "Start", "End", "SLA", "Action"]}
                rows={contracts.map((contract, index) => {
                  const record: MasterCrudRecord = {
                    id: contract.id,
                    values: {
                      vendorName: contract.vendorName,
                      contractNumber: contract.contractNumber,
                      startDate: formatDateInput(contract.startDate),
                      endDate: formatDateInput(contract.endDate),
                      slaResponseHours: contract.slaResponseHours,
                      slaResolutionHours: contract.slaResolutionHours,
                      notes: contract.notes,
                    },
                    assetCount: contract._count.assets,
                  };

                  return [
                    <span className="text-[var(--muted)]">{index + 1}</span>,
                    contract.vendorName,
                    <span className="text-[var(--muted)]">{contract.contractNumber ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatDate(contract.startDate)}</span>,
                    <span className="text-[var(--muted)]">{formatDate(contract.endDate)}</span>,
                    <span className="text-[var(--muted)]">{`${contract.slaResponseHours ?? "-"} / ${contract.slaResolutionHours ?? "-"}`}</span>,
                    <MasterRowActions
                      canManage={canManage}
                      deleteAction={deleteVendorContractAction}
                      deleteDescription={`Vendor contract "${contract.vendorName}" akan dihapus jika belum dipakai asset.`}
                      deleteTitle="Hapus Vendor Contract"
                      editDescription="Perbarui vendor, kontrak, periode, SLA, atau catatan."
                      editFields={fields}
                      editTitle="Edit Vendor Contract"
                      record={record}
                      updateAction={updateVendorContractAction}
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
        <PageHeader title="Vendor & Kontrak Aset" subtitle="Kelola vendor contract aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data vendor contract gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
