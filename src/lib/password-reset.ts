import "server-only";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { headers } from "next/headers";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TTL_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 3;
const REQUEST_WINDOW_MINUTES = 15;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

async function getAppBaseUrl() {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");

  if (configured && (process.env.NODE_ENV === "production" || configured !== "http://localhost")) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL is not configured.");
  }

  // Development only: derive the origin from the request. Production always uses APP_URL
  // so a forged Host header cannot redirect reset links to another domain.
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

async function getRequestIp() {
  const headerStore = await headers();

  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null;
}

/**
 * Creates a single-use reset token and emails the link.
 * Always resolves silently for unknown emails so the response never reveals which accounts exist.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });

  if (!user) {
    return;
  }

  const windowStart = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000);
  const recentRequests = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: windowStart } },
  });

  if (recentRequests >= MAX_REQUESTS_PER_WINDOW) {
    return;
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  const requestedIp = await getRequestIp();

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt, requestedIp },
    }),
  ]);

  const resetUrl = `${await getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const name = escapeHtml(user.name);

  await sendMail({
    to: user.email,
    subject: "Reset password Asset Management System",
    text: [
      `Halo ${user.name},`,
      "",
      "Kami menerima permintaan untuk mereset password akun Anda.",
      `Buka tautan berikut untuk membuat password baru (berlaku ${PASSWORD_RESET_TTL_MINUTES} menit):`,
      resetUrl,
      "",
      "Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.",
    ].join("\n"),
    html: `<p>Halo ${name},</p>
<p>Kami menerima permintaan untuk mereset password akun Anda.</p>
<p><a href="${escapeHtml(resetUrl)}">Buat password baru</a></p>
<p>Tautan ini berlaku ${PASSWORD_RESET_TTL_MINUTES} menit dan hanya bisa dipakai sekali.</p>
<p>Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</p>`,
  });
}

/** Returns the token record when it exists, is unused, and has not expired. */
export async function findValidResetToken(token: string) {
  if (!token) {
    return null;
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return null;
  }

  return record;
}

/** Sets the new password and consumes the token atomically. Returns false if the token is no longer valid. */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const record = await findValidResetToken(token);

  if (!record) {
    return false;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // Claim the token first; a concurrent request that already used it updates zero rows.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (claimed.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { password: passwordHash, passwordChangedAt: now },
    });

    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    });

    return true;
  });
}
