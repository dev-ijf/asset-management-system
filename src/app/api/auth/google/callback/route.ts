import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GOOGLE_FLOW_COOKIE, exchangeGoogleCode, googleConfig, readGoogleFlow, registeredGoogleUser } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const store = await cookies();
  const raw = store.get(GOOGLE_FLOW_COOKIE)?.value;
  store.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/api/auth/google", maxAge: 0 });
  let origin = new URL(request.url).origin;
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  let config;
  try { config = googleConfig(); origin = config.origin; }
  catch { return finish("/login?google_error=unavailable"); }
  const params = new URL(request.url).searchParams;
  const flow = readGoogleFlow(raw, params.get("state"));
  if (!flow) return finish("/login?google_error=invalid");
  if (params.has("error")) return finish("/login?google_error=cancelled");
  const code = params.get("code");
  if (!code) return finish("/login?google_error=invalid");
  try {
    const identity = await exchangeGoogleCode(code, flow, config);
    const user = await registeredGoogleUser(identity.email, email => prisma.user.findUnique({
      where: { email }, select: { id: true, email: true },
    }));
    if (!user) return finish("/login?google_error=unregistered");
    await createSession(user);
    return finish("/dashboard");
  } catch {
    return finish("/login?google_error=failed");
  }
}
