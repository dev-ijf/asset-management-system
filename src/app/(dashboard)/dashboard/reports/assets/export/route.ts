import { NextRequest } from "next/server";
import { createCsv, csvResponse, ensureReportsViewForExport, formatReportDate, formatReportMoney, getParam, parseReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const from = parseReportDate(getParam(searchParams, "from"));
  const to = parseReportDate(getParam(searchParams, "to"));
  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      assetStatusId: getParam(searchParams, "status") || undefined,
      assetClassId: getParam(searchParams, "class") || undefined,
      assetCategoryId: getParam(searchParams, "category") || undefined,
      assetLocationId: getParam(searchParams, "location") || undefined,
      departmentId: getParam(searchParams, "department") || undefined,
      createdAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
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
