import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readDrivePhoto } from "@/lib/google-drive";
import { classAssetWhere, CLASS_PERMISSIONS, getClassScope } from "@/lib/class-scope";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401, headers });
  const { id, photoId } = await params;
  if (![id, photoId].every(v => /^[0-9a-f-]{36}$/i.test(v))) return new Response(null, { status: 404, headers });
  // Homeroom teachers may see photos of their own class's assets only.
  let assetScope: Prisma.AssetWhereInput = { deletedAt: null };
  if (!hasPermission(user, "assets.view")) {
    const scope = hasPermission(user, CLASS_PERMISSIONS.view) ? await getClassScope(user.id) : null;
    if (!scope) return new Response(null, { status: 403, headers });
    assetScope = classAssetWhere(scope);
  }
  const photo = await prisma.assetPhoto.findFirst({ where: { id: photoId, assetId: id, asset: assetScope } });
  if (!photo?.driveFileId) return new Response(null, { status: 404, headers });
  try {
    return new Response(await readDrivePhoto(photo.driveFileId), { headers: {
      ...headers, "Content-Type": "image/webp", "Content-Disposition": "inline", "Cross-Origin-Resource-Policy": "same-origin",
    } });
  } catch { return new Response(null, { status: 502, headers }); }
}
