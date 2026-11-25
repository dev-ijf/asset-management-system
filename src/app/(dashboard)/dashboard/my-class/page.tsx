import Link from "next/link";
import { Eye } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { ClassMaintenanceTracker } from "@/components/class/class-maintenance-tracker";
import { AssetRequestCreateButton, ClassMaintenanceButton } from "@/components/class/class-forms";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { FilterField, FilterPanel } from "@/components/tables/filter-panel";
import { Pagination } from "@/components/tables/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { hasPermission, requirePermission } from "@/lib/auth";
import { classAssetWhere, CLASS_PERMISSIONS, getClassScope } from "@/lib/class-scope";
import { buildLocationTree } from "@/lib/location-tree";
import { paginate } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; limit?: string; status?: string; location?: string }>;
};

export default async function MyClassPage({ searchParams }: PageProps) {
  const user = await requirePermission(CLASS_PERMISSIONS.view);
  const params = await searchParams;
  const canRequestMaintenance = hasPermission(user, CLASS_PERMISSIONS.requestMaintenance);
  const canRequestAsset = hasPermission(user, CLASS_PERMISSIONS.requestAsset);
  const scope = await getClassScope(user.id);

  const headerActions = canRequestAsset ? <AssetRequestCreateButton /> : null;

  if (!scope) {
    return (
      <>
        <PageHeader title="Asset Kelas Saya" actions={headerActions} />
        <EmptyState
          title="Akun Anda belum dihubungkan ke kelas."
          description="Minta admin mengisi Lokasi Kelas di Security › Users agar asset kelas Anda tampil di sini."
        />
      </>
    );
  }

  const q = params.q?.trim() ?? "";
  const locationFilter = params.location && scope.locationIds.includes(params.location) ? params.location : "";
  const where: Prisma.AssetWhereInput = {
    AND: [
      classAssetWhere(scope),
      q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {},
      params.status ? { assetStatusId: params.status } : {},
      locationFilter ? { assetLocationId: locationFilter } : {},
    ],
  };

  const [{ items: assets, pagination }, statuses, locations] = await Promise.all([
    paginate(params, () => prisma.asset.count({ where }), ({ skip, take }) =>
      prisma.asset.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: { assetStatus: true, assetCategory: true, assetLocation: true },
      }),
    ),
    prisma.assetStatus.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
  ]);
  const subLocations = buildLocationTree(locations).filter((item) => scope.locationIds.includes(item.id));
  const activeFilters = [params.status, locationFilter].filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Asset Kelas Saya"
        subtitle={`Asset di ${scope.location.path}. Laporkan kerusakan dengan tombol Ajukan Maintenance.`}
        actions={headerActions}
      />
      <div className="space-y-5">
        <Card>
          <CardContent className="space-y-4">
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={q}
                searchPlaceholder="Cari kode atau nama asset"
                activeCount={activeFilters}
                resetHref={q ? `/dashboard/my-class?q=${encodeURIComponent(q)}` : "/dashboard/my-class"}
              >
                <FilterField label="Status">
                  <Select name="status" defaultValue={params.status ?? ""}>
                    <option value="">Semua status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </Select>
                </FilterField>
                {subLocations.length > 1 ? (
                  <FilterField label="Lokasi">
                    <Select name="location" defaultValue={locationFilter}>
                      <option value="">Semua lokasi kelas</option>
                      {subLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.path}
                        </option>
                      ))}
                    </Select>
                  </FilterField>
                ) : null}
              </FilterPanel>
            </form>
            <DataTable
              columns={["Kode", "Nama", "Kategori", "Status", "Lokasi", "Action"]}
              rows={assets.map((asset) => [
                <span key="code" className="font-medium">{asset.code}</span>,
                asset.name,
                asset.assetCategory?.name ?? "-",
                asset.assetStatus ? <Badge key="status">{asset.assetStatus.name}</Badge> : "-",
                asset.assetLocation?.name ?? "-",
                <div key="actions" className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/my-class/${asset.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium text-[var(--text)] hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    Detail
                  </Link>
                  {canRequestMaintenance ? <ClassMaintenanceButton assetId={asset.id} assetLabel={`${asset.code} - ${asset.name}`} /> : null}
                </div>,
              ])}
              emptyTitle={q || activeFilters ? "Tidak ada asset yang cocok dengan filter." : "Belum ada asset di kelas ini."}
            />
            <Pagination {...pagination} />
          </CardContent>
        </Card>
        {canRequestMaintenance ? <ClassMaintenanceTracker userId={user.id} /> : null}
      </div>
    </>
  );
}
