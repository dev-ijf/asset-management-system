import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createCsv, csvResponse, formatReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!hasPermission(user, "assets.view")) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const p = request.nextUrl.searchParams;
  const q = p.get("q")?.trim() ?? "";
  const assets = await prisma.asset.findMany({ where: { deletedAt: null, archivedAt: { not: null }, assetCategoryId: p.get("category") || undefined, assetLocationId: p.get("location") || undefined, departmentId: p.get("department") || undefined, ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { serialNumber: { contains: q, mode: "insensitive" } }] } : {}) }, include: { assetCategory: true, assetLocation: true, department: true, assetStatus: true, archivedBy: { select: { name: true } } }, orderBy: { archivedAt: "desc" } });
  return csvResponse("asset-archive.csv", createCsv(["Code", "Name", "Category", "Location", "Department", "Status", "Archived At", "Archived By", "Reason"], assets.map((x) => [x.code, x.name, x.assetCategory?.name, x.assetLocation?.name, x.department?.name, x.assetStatus?.name, x.archivedAt ? formatReportDate(x.archivedAt) : "", x.archivedBy?.name, x.archiveReason])));
}
