import Link from "next/link";
import {
  Activity,
  Building2,
  MapPin,
  Network,
  PackageSearch,
  ShieldCheck,
  Tags,
  UserCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AssetViewPageProps = {
  params: Promise<{ token: string }>;
};

/** Soft colour pairs for the icon bubbles, so each detail is easy to spot at a glance. */
const TONES = {
  violet: "bg-[#eeeafe] text-[#3212b8]",
  green: "bg-[#e7f9ef] text-[#13a251]",
  pink: "bg-[#ffe8f8] text-[#e0299f]",
  blue: "bg-[#e4f8ff] text-[#0288c7]",
  orange: "bg-[#fff1e0] text-[#e07b00]",
  teal: "bg-[#e0f7f4] text-[#0f9488]",
} as const;

function InfoItem({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | null | undefined;
  icon: LucideIcon;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--text)] [overflow-wrap:break-word]">{value || "-"}</p>
      </div>
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

  // "Location" shows the Parent Location (top of the tree), "Detail Location" the asset's own
  // (sub-)location. An asset placed directly on a Parent Location shows it in both.
  let parentLocation = asset.assetLocation;
  for (let depth = 0; parentLocation?.parentId && depth < 20; depth += 1) {
    const parent = await prisma.assetLocation.findUnique({ where: { id: parentLocation.parentId } });
    if (!parent) break;
    parentLocation = parent;
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
              <InfoItem label="Status" value={asset.assetStatus?.name} icon={Activity} tone="green" />
              <InfoItem label="Category" value={asset.assetCategory?.name} icon={Tags} tone="pink" />
              <InfoItem label="Location" value={parentLocation?.name} icon={Building2} tone="violet" />
              <InfoItem label="Detail Location" value={asset.assetLocation?.name} icon={MapPin} tone="blue" />
              <InfoItem label="Department" value={asset.department?.name} icon={Network} tone="orange" />
              <InfoItem label="Asset User" value={asset.assetUser?.name} icon={UserRound} tone="teal" />
              <InfoItem label="Person In Charge" value={asset.personInCharge?.name} icon={UserCheck} tone="violet" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
