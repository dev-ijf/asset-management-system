import { redirect } from "next/navigation";
import { hasPermission, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
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

export async function getTransactionOptions() {
  const [assets, locations, departments, users] = await Promise.all([
    prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.assetLocation.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
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
    locations: locations.map((location) => ({ id: location.id, label: `${location.code} - ${location.name}` })),
    departments: departments.map((department) => ({ id: department.id, label: `${department.code} - ${department.name}` })),
    users: users.map((user) => ({ id: user.id, label: `${user.name}${user.email ? ` (${user.email})` : ""}` })),
  };
}
