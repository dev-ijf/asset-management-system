import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}` || request.nextUrl.searchParams.get("secret") === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const warrantyLimit = addDays(now, 30);
  const maintenanceLimit = addDays(now, 7);

  const [warrantyAssets, maintenanceDue] = await Promise.all([
    prisma.asset.findMany({
      where: {
        deletedAt: null,
        warrantyEnd: {
          gte: now,
          lte: warrantyLimit,
        },
      },
      select: {
        code: true,
        id: true,
        name: true,
        warrantyEnd: true,
      },
      orderBy: { warrantyEnd: "asc" },
      take: 50,
    }),
    prisma.assetMaintenance.findMany({
      where: {
        status: { not: "COMPLETED" },
        scheduledDate: {
          gte: now,
          lte: maintenanceLimit,
        },
      },
      include: {
        asset: { select: { code: true, name: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 50,
    }),
  ]);

  const payload = {
    generatedAt: now.toISOString(),
    maintenanceDue: maintenanceDue.map((item) => ({
      asset: `${item.asset.code} - ${item.asset.name}`,
      description: item.description,
      id: item.id,
      scheduledDate: item.scheduledDate?.toISOString() ?? null,
      status: item.status,
    })),
    warrantyExpiring: warrantyAssets.map((asset) => ({
      asset: `${asset.code} - ${asset.name}`,
      id: asset.id,
      warrantyEnd: asset.warrantyEnd?.toISOString() ?? null,
    })),
  };

  const webhookUrl = process.env.ASSET_ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
    } catch {
      return NextResponse.json({ ...payload, webhook: "failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ ...payload, webhook: webhookUrl ? "sent" : "not_configured" });
}
