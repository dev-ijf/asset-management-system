import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { classAssetWhere, CLASS_PERMISSIONS, getClassScope } from "@/lib/class-scope";
import { readDrivePhoto } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A photo of the damage on a maintenance request or record. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401, headers });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404, headers });

  // Asset staff and reviewers see every photo; a homeroom teacher only those of their class.
  let assetScope: Prisma.AssetWhereInput = {};
  if (!["assets.view", "maintenance.manage", "approvals.manage"].some((permission) => hasPermission(user, permission))) {
    const scope = hasPermission(user, CLASS_PERMISSIONS.view) ? await getClassScope(user.id) : null;
    if (!scope) return new Response(null, { status: 403, headers });
    assetScope = classAssetWhere(scope);
  }

  const photo = await prisma.maintenancePhoto.findFirst({ where: { id, asset: assetScope } });
  if (!photo) return new Response(null, { status: 404, headers });
  try {
    return new Response(await readDrivePhoto(photo.driveFileId), {
      headers: { ...headers, "Content-Type": "image/webp", "Content-Disposition": "inline", "Cross-Origin-Resource-Policy": "same-origin" },
    });
  } catch {
    return new Response(null, { status: 502, headers });
  }
}
