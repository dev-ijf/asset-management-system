import { redirect } from "next/navigation";
import { selectableAssets, type TransactionPurpose } from "@/lib/asset-disposal";
import { hasPermission, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wibFormat } from "@/lib/datetime";
import { locationOptions } from "@/lib/location-tree";

export function formatDate(date: Date | null) {
  if (!date) return "-";
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date | null) {
  if (!date) return "-";
  return wibFormat({
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMoney(value: unknown) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value));
}

export async function requireAnyPermission(permissions: string[]) {
  const user = await requireAuth();

  if (!permissions.some((permission) => hasPermission(user, permission))) {
    redirect("/dashboard");
  }

  return user;
}

export async function getTransactionOptions(purpose: TransactionPurpose = "other") {
  const [assets, locations, departments, users] = await Promise.all([
    prisma.asset.findMany({
      where: selectableAssets(purpose),
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
    prisma.department.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.assetUser.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return {
    assets: assets.map((asset) => ({ id: asset.id, label: `${asset.code} - ${asset.name}` })),
    locations: locationOptions(locations),
    departments: departments.map((department) => ({ id: department.id, label: `${department.code} - ${department.name}` })),
    users: users.map((user) => ({ id: user.id, label: `${user.name}${user.email ? ` (${user.email})` : ""}` })),
  };
}
