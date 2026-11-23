import { prisma } from "@/lib/prisma";
import { readDrivePhoto } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public primary photo of an asset, looked up by its QR token, for the QR scan page (no login).
 * Only the primary photo is exposed; other photos stay behind the authenticated route.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const headers = { "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" };
  const { token } = await params;
  const photo = await prisma.assetPhoto.findFirst({
    where: { asset: { qrToken: token, deletedAt: null } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  if (!photo?.driveFileId) return new Response(null, { status: 404, headers });
  try {
    return new Response(await readDrivePhoto(photo.driveFileId), {
      headers: { ...headers, "Content-Type": "image/webp", "Content-Disposition": "inline" },
    });
  } catch {
    return new Response(null, { status: 502, headers });
  }
}
