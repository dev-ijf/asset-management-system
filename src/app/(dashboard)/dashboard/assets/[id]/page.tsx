import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FileWarning, GitBranch, History, ShieldCheck } from "lucide-react";
import { AssetPhotoSection } from "@/components/assets/asset-photo-section";
import { AssetQrCard } from "@/components/assets/asset-qr-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--text)]">{value || "-"}</div>
    </div>
  );
}

function PlaceholderCard({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-[var(--border)] p-4">
      <div className="flex items-center gap-3 text-[var(--muted)]">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
    </div>
  );
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      assetStatus: true,
      assetClass: true,
      assetCategory: true,
      assetLocation: true,
      unit: true,
      department: true,
      personInCharge: true,
      assetUser: {
        include: {
          department: true,
        },
      },
      warranty: true,
      vendorContract: true,
      archivedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      photos: {
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      },
      histories: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          changedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={asset.name}
        subtitle={`${asset.code} • ${asset.serialNumber ?? "No serial number"}`}
        actions={
          <Link
            href="/dashboard/assets"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--text)] transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <DetailItem label="Code" value={<span className="font-semibold">{asset.code}</span>} />
              <DetailItem label="Status" value={asset.assetStatus ? <Badge>{asset.assetStatus.name}</Badge> : "-"} />
              <DetailItem label="Name" value={asset.name} />
              <DetailItem label="Serial Number" value={asset.serialNumber ?? "-"} />
              <DetailItem label="Description" value={asset.description ?? "-"} />
              <DetailItem label="Created At" value={formatDateTime(asset.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <DetailItem label="Class" value={asset.assetClass ? `${asset.assetClass.code} - ${asset.assetClass.name}` : "-"} />
              <DetailItem label="Category" value={asset.assetCategory ? `${asset.assetCategory.code} - ${asset.assetCategory.name}` : "-"} />
              <DetailItem label="Unit" value={asset.unit ? `${asset.unit.symbol} - ${asset.unit.name}` : "-"} />
              <DetailItem label="Location" value={asset.assetLocation ? `${asset.assetLocation.code} - ${asset.assetLocation.name}` : "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ownership & Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <DetailItem label="Department" value={asset.department ? `${asset.department.code} - ${asset.department.name}` : "-"} />
              <DetailItem label="Person In Charge" value={asset.personInCharge?.name ?? "-"} />
              <DetailItem label="Asset User" value={asset.assetUser?.name ?? "-"} />
              <DetailItem label="Asset User Department" value={asset.assetUser?.department ? `${asset.assetUser.department.code} - ${asset.assetUser.department.name}` : "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finance & Warranty</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <DetailItem label="Purchase Date" value={formatDate(asset.purchaseDate)} />
              <DetailItem label="Cost" value={formatMoney(asset.cost)} />
              <DetailItem label="Residual Value" value={formatMoney(asset.residualValue)} />
              <DetailItem label="Useful Life Months" value={asset.usefulLifeMonths ?? "-"} />
              <DetailItem label="Depreciation Method" value={asset.depreciationMethod} />
              <DetailItem label="Capex/Opex" value={asset.capexOpex ?? "-"} />
              <DetailItem label="Warranty" value={asset.warranty ? `${asset.warranty.name} (${asset.warranty.durationMonths} bulan)` : "-"} />
              <DetailItem label="Vendor Contract" value={asset.vendorContract ? `${asset.vendorContract.vendorName}${asset.vendorContract.contractNumber ? ` - ${asset.vendorContract.contractNumber}` : ""}` : "-"} />
            </CardContent>
          </Card>

          <AssetPhotoSection assetId={asset.id} canManage={canManage} photos={asset.photos} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Riwayat Terbaru</CardTitle>
                <Link href={`/dashboard/assets/${asset.id}/history`} className="text-sm font-medium text-[var(--primary)] hover:underline">
                  Lihat semua
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.histories.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada riwayat asset.</p>
              ) : (
                asset.histories.map((history) => (
                  <div key={history.id} className="rounded-md border border-[var(--border)] p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-[var(--text)]">{history.action}</p>
                      <p className="text-xs text-[var(--muted)]">{formatDateTime(history.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{history.description ?? "-"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">User: {history.changedBy?.name ?? "-"}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <AssetQrCard assetCode={asset.code} assetName={asset.name} qrToken={asset.qrToken} />

          <Card>
            <CardHeader>
              <CardTitle>Status Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem label="Archived At" value={formatDateTime(asset.archivedAt)} />
              <DetailItem label="Archived By" value={asset.archivedBy ? `${asset.archivedBy.name} (${asset.archivedBy.email})` : "-"} />
              <DetailItem label="Retention Until" value={formatDate(asset.retentionUntil)} />
              <DetailItem label="Deleted At" value={formatDateTime(asset.deletedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem label="QR Token" value={<span className="break-all font-mono text-xs">{asset.qrToken}</span>} />
              <DetailItem label="QR Path" value={asset.qrPath ?? "-"} />
              <DetailItem label="RFID Tag" value={asset.rfidTag ?? "-"} />
              <DetailItem label="NFC Tag" value={asset.nfcTag ?? "-"} />
              <DetailItem label="Label Template" value={asset.labelTemplate ?? "-"} />
              <DetailItem label="Consumable" value={asset.isConsumable ? "Ya" : "Tidak"} />
              <DetailItem label="Quantity" value={asset.quantity} />
              <DetailItem label="Available Quantity" value={asset.availableQuantity ?? "-"} />
              <DetailItem label="Pool Asset" value={asset.isPool ? "Ya" : "Tidak"} />
              <DetailItem
                label="Metadata"
                value={
                  asset.metadata ? (
                    <pre className="max-h-48 overflow-auto rounded-md bg-slate-50 p-3 text-xs">{JSON.stringify(asset.metadata, null, 2)}</pre>
                  ) : (
                    "-"
                  )
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Placeholder Modul Berikutnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PlaceholderCard icon={<History className="h-5 w-5" />} title="History asset" />
              <PlaceholderCard icon={<GitBranch className="h-5 w-5" />} title="Movement" />
              <PlaceholderCard icon={<FileWarning className="h-5 w-5" />} title="Disposal" />
              <PlaceholderCard icon={<ShieldCheck className="h-5 w-5" />} title="Audit" />
              <PlaceholderCard icon={<ClipboardList className="h-5 w-5" />} title="Maintenance" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
