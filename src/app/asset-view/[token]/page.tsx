import Link from "next/link";
import { Building2, MapPin, PackageSearch, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AssetViewPageProps = {
  params: Promise<{ token: string }>;
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value || "-"}</p>
    </div>
  );
}

function AssetViewNotFound() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <PackageSearch className="h-7 w-7" />
            </div>
            <CardTitle>Asset Tidak Ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[var(--muted)]">
              QR token tidak ditemukan, asset sudah dihapus, atau link scan tidak valid.
            </p>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--text)] transition hover:bg-slate-50"
            >
              Kembali
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default async function AssetViewPage({ params }: AssetViewPageProps) {
  const { token } = await params;

  const asset = await prisma.asset.findUnique({
    where: { qrToken: token },
    include: {
      assetStatus: true,
      assetCategory: true,
      assetLocation: true,
      department: true,
      assetUser: true,
      personInCharge: true,
    },
  });

  if (!asset || asset.deletedAt) {
    return <AssetViewNotFound />;
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{asset.code}</p>
                <CardTitle className="mt-1">{asset.name}</CardTitle>
              </div>
              {asset.assetStatus ? <Badge>{asset.assetStatus.name}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-md border border-[var(--border)] bg-[var(--table-head)] p-4">
              <div className="flex items-center gap-3 text-[var(--muted)]">
                <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
                <p className="text-sm leading-6">
                  Halaman ini adalah tampilan publik terbatas dari QR asset. Data finansial, metadata internal, RFID, dan NFC tidak ditampilkan.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Status" value={asset.assetStatus?.name} />
              <InfoItem label="Category" value={asset.assetCategory ? `${asset.assetCategory.code} - ${asset.assetCategory.name}` : null} />
              <InfoItem label="Location" value={asset.assetLocation ? `${asset.assetLocation.code} - ${asset.assetLocation.name}` : null} />
              <InfoItem label="Department" value={asset.department ? `${asset.department.code} - ${asset.department.name}` : null} />
              <InfoItem label="Asset User" value={asset.assetUser?.name} />
              <InfoItem label="Person In Charge" value={asset.personInCharge?.name} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--border)] bg-white p-4">
            <MapPin className="h-5 w-5 text-[var(--primary)]" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Lokasi</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{asset.assetLocation?.name ?? "-"}</p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-white p-4">
            <Building2 className="h-5 w-5 text-[var(--primary)]" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Departemen</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{asset.department?.name ?? "-"}</p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-white p-4">
            <UserRound className="h-5 w-5 text-[var(--primary)]" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Penanggung Jawab</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{asset.personInCharge?.name ?? asset.assetUser?.name ?? "-"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
