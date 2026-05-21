import { AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { AssetCreateAction, AssetRowActions, type AssetFormOptions, type AssetRow } from "@/components/assets/asset-form-client";
import { DataTable } from "@/components/tables/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AssetsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    class?: string;
    category?: string;
    location?: string;
    department?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function toAssetRow(asset: Awaited<ReturnType<typeof getAssets>>[number]): AssetRow {
  return {
    id: asset.id,
    code: asset.code,
    name: asset.name,
    serialNumber: asset.serialNumber,
    description: asset.description,
    assetStatusId: asset.assetStatusId,
    assetClassId: asset.assetClassId,
    assetCategoryId: asset.assetCategoryId,
    assetLocationId: asset.assetLocationId,
    unitId: asset.unitId,
    departmentId: asset.departmentId,
    personInChargeId: asset.personInChargeId,
    assetUserId: asset.assetUserId,
    warrantyId: asset.warrantyId,
    vendorContractId: asset.vendorContractId,
    purchaseDate: formatDateInput(asset.purchaseDate),
    cost: asset.cost?.toString() ?? "",
    residualValue: asset.residualValue?.toString() ?? "",
    usefulLifeMonths: asset.usefulLifeMonths?.toString() ?? "",
    depreciationMethod: asset.depreciationMethod,
    capexOpex: asset.capexOpex ?? "",
    metadata: asset.metadata ? JSON.stringify(asset.metadata, null, 2) : "",
    qrPath: asset.qrPath,
    rfidTag: asset.rfidTag,
    nfcTag: asset.nfcTag,
    labelTemplate: asset.labelTemplate,
    isConsumable: asset.isConsumable,
    quantity: asset.quantity,
    availableQuantity: asset.availableQuantity?.toString() ?? "",
    isPool: asset.isPool,
    retentionUntil: formatDateInput(asset.retentionUntil),
    archivedAt: asset.archivedAt ? formatDate(asset.archivedAt) : null,
    deletedAt: asset.deletedAt ? formatDate(asset.deletedAt) : null,
  };
}

async function getAssets({
  categoryId,
  classId,
  departmentId,
  locationId,
  query,
  statusId,
}: {
  categoryId: string;
  classId: string;
  departmentId: string;
  locationId: string;
  query: string;
  statusId: string;
}) {
  return prisma.asset.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { serialNumber: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(statusId ? { assetStatusId: statusId } : {}),
      ...(classId ? { assetClassId: classId } : {}),
      ...(categoryId ? { assetCategoryId: categoryId } : {}),
      ...(locationId ? { assetLocationId: locationId } : {}),
      ...(departmentId ? { departmentId } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      assetStatus: true,
      assetClass: true,
      assetCategory: true,
      assetLocation: true,
      department: true,
      personInCharge: true,
      assetUser: true,
    },
  });
}

async function getOptions(): Promise<AssetFormOptions> {
  const [
    statuses,
    classes,
    categories,
    locations,
    units,
    departments,
    people,
    assetUsers,
    warranties,
    vendorContracts,
  ] = await Promise.all([
    prisma.assetStatus.findMany({ orderBy: [{ code: "asc" }], select: { id: true, code: true, name: true } }),
    prisma.assetClass.findMany({ orderBy: [{ code: "asc" }], select: { id: true, code: true, name: true } }),
    prisma.assetCategory.findMany({ orderBy: [{ code: "asc" }], select: { id: true, code: true, name: true } }),
    prisma.assetLocation.findMany({ orderBy: [{ code: "asc" }], select: { id: true, code: true, name: true } }),
    prisma.unit.findMany({ orderBy: [{ symbol: "asc" }], select: { id: true, symbol: true, name: true } }),
    prisma.department.findMany({ orderBy: [{ code: "asc" }], select: { id: true, code: true, name: true } }),
    prisma.personInCharge.findMany({ orderBy: [{ name: "asc" }], select: { id: true, name: true } }),
    prisma.assetUser.findMany({ orderBy: [{ name: "asc" }], select: { id: true, name: true } }),
    prisma.warranty.findMany({ orderBy: [{ name: "asc" }], select: { id: true, name: true, durationMonths: true } }),
    prisma.vendorContract.findMany({ orderBy: [{ vendorName: "asc" }], select: { id: true, vendorName: true, contractNumber: true } }),
  ]);

  return {
    statuses: statuses.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` })),
    classes: classes.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` })),
    categories: categories.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` })),
    locations: locations.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` })),
    units: units.map((item) => ({ id: item.id, label: `${item.symbol} - ${item.name}` })),
    departments: departments.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` })),
    people: people.map((item) => ({ id: item.id, label: item.name })),
    assetUsers: assetUsers.map((item) => ({ id: item.id, label: item.name })),
    warranties: warranties.map((item) => ({ id: item.id, label: `${item.name} (${item.durationMonths} bulan)` })),
    vendorContracts: vendorContracts.map((item) => ({
      id: item.id,
      label: item.contractNumber ? `${item.vendorName} - ${item.contractNumber}` : item.vendorName,
    })),
  };
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const statusId = String(params.status ?? "").trim();
  const classId = String(params.class ?? "").trim();
  const categoryId = String(params.category ?? "").trim();
  const locationId = String(params.location ?? "").trim();
  const departmentId = String(params.department ?? "").trim();

  try {
    const [assets, options] = await Promise.all([
      getAssets({ categoryId, classId, departmentId, locationId, query, statusId }),
      getOptions(),
    ]);
    const hasFilter = Boolean(query || statusId || classId || categoryId || locationId || departmentId);

    return (
      <>
        <PageHeader
          title="Data List Aset"
          subtitle="Kelola daftar aset, kode inventaris, status operasional, lokasi, dan kepemilikan aset."
          actions={<AssetCreateAction canManage={canManage} options={options} />}
        />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Daftar Aset</CardTitle>
              {hasFilter ? (
                <Link href="/dashboard/assets" className="text-sm font-medium text-[var(--primary)] hover:underline">
                  Reset filter
                </Link>
              ) : null}
            </div>
            <form className="grid gap-3 lg:grid-cols-6">
              <div className="relative lg:col-span-2">
                <Input name="q" placeholder="Cari code, name, serial number" defaultValue={query} className="h-10 pr-10" />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Select name="status" defaultValue={statusId} className="h-10">
                <option value="">Semua status</option>
                {options.statuses.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </Select>
              <Select name="class" defaultValue={classId} className="h-10">
                <option value="">Semua class</option>
                {options.classes.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </Select>
              <Select name="category" defaultValue={categoryId} className="h-10">
                <option value="">Semua category</option>
                {options.categories.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </Select>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary" className="h-10 flex-1">Filter</Button>
              </div>
              <Select name="location" defaultValue={locationId} className="h-10">
                <option value="">Semua location</option>
                {options.locations.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </Select>
              <Select name="department" defaultValue={departmentId} className="h-10">
                <option value="">Semua department</option>
                {options.departments.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </Select>
            </form>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <EmptyState
                title={hasFilter ? "Data aset tidak ditemukan." : "Belum ada data aset."}
                description={hasFilter ? "Coba ubah kata kunci atau filter." : "Tambah aset pertama untuk mulai mengelola inventaris."}
              />
            ) : (
              <DataTable
                columns={["No", "Code", "Name", "Status", "Class", "Category", "Location", "Department", "User/PIC", "Cost", "Created At", "Action"]}
                rows={assets.map((asset, index) => {
                  const row = toAssetRow(asset);

                  return [
                    <span className="text-[var(--muted)]">{index + 1}</span>,
                    <span className="font-semibold">{asset.code}</span>,
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      {asset.serialNumber ? <p className="text-xs text-[var(--muted)]">{asset.serialNumber}</p> : null}
                    </div>,
                    asset.assetStatus ? <Badge>{asset.assetStatus.name}</Badge> : <span className="text-[var(--muted)]">-</span>,
                    <span className="text-[var(--muted)]">{asset.assetClass?.name ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{asset.assetCategory?.name ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{asset.assetLocation?.name ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{asset.department?.name ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{asset.assetUser?.name ?? asset.personInCharge?.name ?? "-"}</span>,
                    <span className="text-[var(--muted)]">{formatMoney(asset.cost)}</span>,
                    <span className="text-[var(--muted)]">{formatDate(asset.createdAt)}</span>,
                    <AssetRowActions asset={row} canManage={canManage} options={options} />,
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
        <PageHeader title="Data List Aset" subtitle="Kelola daftar aset." />
        <div className="rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-5 text-[var(--danger)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Data aset gagal dimuat.</p>
              <p className="mt-1 text-sm">Pastikan koneksi database aktif lalu coba refresh halaman.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
