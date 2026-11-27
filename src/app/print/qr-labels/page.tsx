import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QrLabelSheet } from "@/components/assets/qr-label-sheet";
import { hasPermission, requireAuth } from "@/lib/auth";
import { assetListWhere, readAssetListFilters } from "@/lib/asset-list-filter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Print QR Asset" };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Printable sheet of QR labels for every asset matching the Data Asset filters (all active
 * assets when none). Lives outside the dashboard layout so only the labels are printed.
 */
export default async function PrintQrLabelsPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  if (!hasPermission(user, "assets.view") && !hasPermission(user, "reports.view")) redirect("/dashboard");

  const filters = readAssetListFilters(await searchParams);
  const assets = await prisma.asset.findMany({
    where: await assetListWhere(filters),
    orderBy: { code: "asc" },
    select: { code: true, name: true, qrToken: true },
  });
  const filtered = Object.values(filters).some(Boolean);

  return <QrLabelSheet assets={assets} filtered={filtered} />;
}
