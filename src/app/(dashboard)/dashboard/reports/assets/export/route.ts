import { NextRequest } from "next/server";
import { createCsv, csvResponse, ensureReportsViewForExport, formatReportDate, formatReportMoney, getParam } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";
import { dateRangeErrorResponse, parseDateRange } from "@/lib/date-range";
import { assetLocationFilter } from "@/lib/location-filter";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const range = parseDateRange(getParam(searchParams, "from"), getParam(searchParams, "to"));
  if (range.error) return dateRangeErrorResponse();
  // Same search as the Assets list, so its Export button downloads exactly what is on screen.
  const query = getParam(searchParams, "q");
  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      archivedAt: null,
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { serialNumber: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      assetStatusId: getParam(searchParams, "status") || undefined,
      assetClassId: getParam(searchParams, "class") || undefined,
      assetCategoryId: getParam(searchParams, "category") || undefined,
      assetLocationId: await assetLocationFilter(getParam(searchParams, "location")),
      departmentId: getParam(searchParams, "department") || undefined,
      createdAt: range.filter,
    },
    include: {
      assetStatus: true,
      assetClass: true,
      assetCategory: true,
      assetLocation: true,
      department: true,
      personInCharge: true,
      assetUser: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = createCsv(
    ["Code", "Name", "Status", "Class", "Category", "Location", "Department", "PIC/User", "Cost", "Created At"],
    assets.map((asset) => [
      asset.code,
      asset.name,
      asset.assetStatus?.name,
      asset.assetClass?.name,
      asset.assetCategory?.name,
      asset.assetLocation?.name,
      asset.department?.name,
      asset.personInCharge?.name ?? asset.assetUser?.name,
      formatReportMoney(asset.cost),
      formatReportDate(asset.createdAt),
    ]),
  );

  return csvResponse("assets-report.csv", csv);
}
