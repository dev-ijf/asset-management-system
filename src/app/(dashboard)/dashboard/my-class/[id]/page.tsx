import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { ClassMaintenanceButton } from "@/components/class/class-forms";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission, requirePermission } from "@/lib/auth";
import { classAssetWhere, CLASS_PERMISSIONS, getClassScope } from "@/lib/class-scope";
import { formatDate } from "@/lib/asset-transaction-view";
import { buildLocationTree } from "@/lib/location-tree";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-[var(--border)] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--text)] [overflow-wrap:break-word]">{value || "-"}</p>
    </div>
  );
}

/** Asset detail for a homeroom teacher: what the asset is and its upkeep, without financial data. */
export default async function MyClassAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(CLASS_PERMISSIONS.view);
  const { id } = await params;
  const scope = await getClassScope(user.id);
  if (!scope || !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const asset = await prisma.asset.findFirst({
    where: { id, ...classAssetWhere(scope) },
    include: {
      assetStatus: true,
      assetCategory: true,
      department: true,
      assetUser: true,
      personInCharge: true,
      photos: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      maintenances: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!asset) notFound();

  const locations = await prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } });
  const locationPath = buildLocationTree(locations).find((item) => item.id === asset.assetLocationId)?.path;
  const photo = asset.photos[0];

  return (
    <>
      <PageHeader
        title={asset.name}
        subtitle={asset.code}
        actions={
          <>
            <Link href="/dashboard/my-class" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            {hasPermission(user, CLASS_PERMISSIONS.requestMaintenance) ? (
              <ClassMaintenanceButton assetId={asset.id} assetLabel={`${asset.code} - ${asset.name}`} size="md" />
            ) : null}
          </>
        }
      />
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card>
            <CardContent className="pt-5">
              {photo ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.path} alt={`Foto ${asset.name}`} className="h-72 w-full rounded-md border border-[var(--border)] bg-slate-50 object-contain" />
                  {asset.photos.length > 1 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {asset.photos.slice(1, 5).map((item) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={item.id} src={item.path} alt="" className="h-16 w-full rounded border border-[var(--border)] object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--border)] bg-slate-50 text-[var(--muted)]">
                  <ImageOff className="h-8 w-8" aria-hidden="true" />
                  <p className="text-sm">Belum ada foto asset</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Asset</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Detail label="Status" value={asset.assetStatus?.name} />
              <Detail label="Kategori" value={asset.assetCategory?.name} />
              <Detail label="Lokasi" value={locationPath} />
              <Detail label="Serial Number" value={asset.serialNumber} />
              <Detail label="Department" value={asset.department?.name} />
              <Detail label="Asset User" value={asset.assetUser?.name} />
              <Detail label="Person In Charge" value={asset.personInCharge?.name} />
              <Detail label="Garansi Sampai" value={formatDate(asset.warrantyEnd)} />
              <div className="sm:col-span-2">
                <Detail label="Deskripsi" value={asset.description} />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Dicatat", "Keterangan", "Status", "Jadwal", "Selesai"]}
              rows={asset.maintenances.map((item) => [
                formatDate(item.createdAt),
                item.description,
                <Badge key="status" variant={item.status === "COMPLETED" ? "success" : "warning"}>{item.status}</Badge>,
                formatDate(item.scheduledDate),
                formatDate(item.completedDate),
              ])}
              emptyTitle="Belum ada riwayat maintenance."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
