import { NextRequest, NextResponse } from "next/server";
import { buildArchiveQuery } from "@/lib/archive-query";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createCsv, csvResponse, formatReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!hasPermission(user, "assets.view")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // Same filter as the Archive page, so the export matches what the user sees.
  const { view, where, orderBy } = buildArchiveQuery(request.nextUrl.searchParams);
  const assets = await prisma.asset.findMany({
    where,
    orderBy,
    include: {
      assetCategory: { select: { name: true } },
      assetLocation: { select: { name: true } },
      department: { select: { name: true } },
      assetStatus: { select: { name: true } },
      archivedBy: { select: { name: true } },
    },
  });

  return csvResponse(
    view === "deleted" ? "asset-deleted.csv" : "asset-archive.csv",
    createCsv(
      ["Code", "Name", "Category", "Location", "Department", "Status", "Archived At", "Archived By", "Archive Reason", "Deleted At"],
      assets.map((x) => [
        x.code,
        x.name,
        x.assetCategory?.name,
        x.assetLocation?.name,
        x.department?.name,
        x.assetStatus?.name,
        x.archivedAt ? formatReportDate(x.archivedAt) : "",
        x.archivedBy?.name,
        x.archiveReason,
        x.deletedAt ? formatReportDate(x.deletedAt) : "",
      ]),
    ),
  );
}
