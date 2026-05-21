import { NextRequest } from "next/server";
import { createCsv, csvResponse, ensureReportsViewForExport, formatReportDate, getParam, parseReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const from = parseReportDate(getParam(searchParams, "from"));
  const to = parseReportDate(getParam(searchParams, "to"));
  const movements = await prisma.assetMovement.findMany({
    where: {
      assetId: getParam(searchParams, "asset") || undefined,
      fromLocationId: getParam(searchParams, "fromLocation") || undefined,
      toLocationId: getParam(searchParams, "toLocation") || undefined,
      performedAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
    },
    include: { asset: true, fromLocation: true, toLocation: true, fromDepartment: true, toDepartment: true, fromAssetUser: true, toAssetUser: true },
    orderBy: { performedAt: "desc" },
  });

  const csv = createCsv(
    ["Asset Code", "Asset Name", "From Location", "To Location", "From Department", "To Department", "From Asset User", "To Asset User", "Performed At", "Notes"],
    movements.map((movement) => [
      movement.asset.code,
      movement.asset.name,
      movement.fromLocation?.name,
      movement.toLocation?.name,
      movement.fromDepartment?.name,
      movement.toDepartment?.name,
      movement.fromAssetUser?.name,
      movement.toAssetUser?.name,
      formatReportDate(movement.performedAt),
      movement.notes,
    ]),
  );

  return csvResponse("movements-report.csv", csv);
}
