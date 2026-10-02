import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_FLOW_COOKIE, GOOGLE_FLOW_TTL, googleConfig, newGoogleFlow, googleAuthorizationUrl } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let config;
  try { config = googleConfig(); }
  catch { return NextResponse.redirect(new URL("/login?google_error=unavailable", request.url)); }
  const flow = newGoogleFlow();
  const store = await cookies();
  store.set(GOOGLE_FLOW_COOKIE, JSON.stringify(flow), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/api/auth/google", maxAge: GOOGLE_FLOW_TTL,
  });
  const response = NextResponse.redirect(googleAuthorizationUrl(config, flow));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
