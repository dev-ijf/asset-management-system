import { NextRequest } from "next/server";
import { createCsv, csvResponse, ensureReportsViewForExport, formatReportDate, getParam } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";
import { movementToValue } from "@/lib/movement-display";
import { dateRangeErrorResponse, parseDateRange } from "@/lib/date-range";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const range = parseDateRange(getParam(searchParams, "from"), getParam(searchParams, "to"));
  if (range.error) return dateRangeErrorResponse();
  const movements = await prisma.assetMovement.findMany({
    where: {
      assetId: getParam(searchParams, "asset") || undefined,
      fromLocationId: getParam(searchParams, "fromLocation") || undefined,
      toLocationId: getParam(searchParams, "toLocation") || undefined,
      performedAt: range.filter,
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
      movementToValue(movement.toLocationId, movement.toLocation),
      movement.fromDepartment?.name,
      movementToValue(movement.toDepartmentId, movement.toDepartment),
      movement.fromAssetUser?.name,
      movementToValue(movement.toAssetUserId, movement.toAssetUser),
      formatReportDate(movement.performedAt),
      movement.notes,
    ]),
  );

  return csvResponse("movements-report.csv", csv);
}
