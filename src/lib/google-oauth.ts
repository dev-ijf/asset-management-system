import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const GOOGLE_FLOW_COOKIE = "ams_google_flow";
export const GOOGLE_FLOW_TTL = 600;
const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const googleErrors: Record<string, string> = {
  unavailable: "Login Google belum dikonfigurasi. Silakan gunakan email dan password.",
  cancelled: "Login Google dibatalkan. Silakan coba lagi.",
  invalid: "Sesi login Google tidak valid atau kedaluwarsa. Silakan coba lagi.",
  unregistered: "Akun Google ini belum terdaftar pada sistem. Silakan hubungi administrator.",
  failed: "Login Google belum berhasil. Silakan coba lagi atau gunakan email dan password.",
};

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) throw new Error("Google OAuth is not configured");
  const url = new URL(redirectUri);
  if (url.pathname !== "/api/auth/google/callback" || url.search || url.hash || url.username || url.password ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("Invalid Google redirect URI");
  }
  return { clientId, clientSecret, redirectUri, origin: url.origin };
}

export type GoogleFlow = { state: string; nonce: string; verifier: string; expiresAt: number };

export function newGoogleFlow(): GoogleFlow {
  return { state: randomBytes(32).toString("base64url"), nonce: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"), expiresAt: Date.now() + GOOGLE_FLOW_TTL * 1000 };
}

export function readGoogleFlow(raw: string | undefined, state: string | null): GoogleFlow | null {
  try {
    const flow = JSON.parse(raw ?? "") as GoogleFlow;
    if (!state || flow.state !== state || !Number.isFinite(flow.expiresAt) || flow.expiresAt <= Date.now() ||
        ![flow.state, flow.nonce, flow.verifier].every(v => typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v))) return null;
    return flow;
  } catch { return null; }
}

export function googleAuthorizationUrl(config: ReturnType<typeof googleConfig>, flow: GoogleFlow) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri,
    response_type: "code", scope: "openid email profile", state: flow.state, nonce: flow.nonce,
    code_challenge: createHash("sha256").update(flow.verifier).digest("base64url"),
    code_challenge_method: "S256", prompt: "select_account" }).toString();
  return url;
}

export function googleIdentity(payload: { sub?: string; email?: unknown; email_verified?: unknown; nonce?: unknown; name?: unknown }, nonce: string) {
  if (payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || !payload.sub) throw new Error("Invalid Google identity");
  return { email: payload.email.trim().toLowerCase(), name: typeof payload.name === "string" ? payload.name : "", googleId: payload.sub };
}

export async function exchangeGoogleCode(code: string, flow: GoogleFlow, config: ReturnType<typeof googleConfig>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret,
      redirect_uri: config.redirectUri, grant_type: "authorization_code", code_verifier: flow.verifier }),
  });
  if (!response.ok) throw new Error("Google code exchange failed");
  const tokens = await response.json();
  if (typeof tokens.id_token !== "string") throw new Error("Missing Google ID token");
  return verifyGoogleToken(tokens.id_token, config.clientId, flow.nonce);
}

export async function verifyGoogleToken(token: string, clientId: string, nonce: string, verificationKeys: Parameters<typeof jwtVerify>[1] = keys) {
  const { payload } = await jwtVerify(token, verificationKeys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"], audience: clientId,
    algorithms: ["RS256"], requiredClaims: ["exp", "iat", "sub"],
  });
  if (payload.azp && payload.azp !== clientId) throw new Error("Invalid authorized party");
  return googleIdentity(payload, nonce);
}

// Deliberately only look up existing users: no account creation or role changes.
export async function registeredGoogleUser<T>(email: string, find: (email: string) => Promise<T | null>) {
  return find(email);
}
