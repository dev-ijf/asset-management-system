import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readDrivePhoto } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401, headers });
  if (!hasPermission(user, "assets.view")) return new Response(null, { status: 403, headers });
  const { id, photoId } = await params;
  if (![id, photoId].every(v => /^[0-9a-f-]{36}$/i.test(v))) return new Response(null, { status: 404, headers });
  const photo = await prisma.assetPhoto.findFirst({ where: { id: photoId, assetId: id, asset: { deletedAt: null } } });
  if (!photo?.driveFileId) return new Response(null, { status: 404, headers });
  try {
    return new Response(await readDrivePhoto(photo.driveFileId), { headers: {
      ...headers, "Content-Type": "image/webp", "Content-Disposition": "inline", "Cross-Origin-Resource-Policy": "same-origin",
    } });
  } catch { return new Response(null, { status: 502, headers }); }
}
