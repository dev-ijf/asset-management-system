import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPair, SignJWT } from "jose";
import { verifyGoogleToken } from "../src/lib/google-oauth.ts";
import { newGoogleFlow, readGoogleFlow, googleAuthorizationUrl, googleIdentity, registeredGoogleUser, googleConfig } from "../src/lib/google-oauth.ts";

test("OAuth binds state, nonce and PKCE; expires and rejects unsolicited callbacks", () => {
  const flow = newGoogleFlow();
  const config = { clientId: "test-client", clientSecret: "test-secret", redirectUri: "http://localhost:3000/api/auth/google/callback" };
  const url = googleAuthorizationUrl(config, flow);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("nonce"), flow.nonce);
  assert.notEqual(url.searchParams.get("code_challenge"), flow.verifier);
  assert.equal(url.searchParams.has("client_secret"), false);
  assert.deepEqual(readGoogleFlow(JSON.stringify(flow), flow.state), flow);
  assert.equal(readGoogleFlow(JSON.stringify(flow), "wrong"), null);
  assert.equal(readGoogleFlow(undefined, flow.state), null);
  assert.equal(readGoogleFlow(JSON.stringify({ ...flow, expiresAt: 0 }), flow.state), null);
});

test("Identity requires verified email, subject and matching nonce", () => {
  const claims = { sub: "google-id", email: "Registered@example.com", email_verified: true, nonce: "nonce", name: "User" };
  assert.equal(googleIdentity(claims, "nonce").email, "registered@example.com");
  for (const changes of [{ email_verified: false }, { nonce: "wrong" }, { sub: "" }, { email: "invalid" }]) {
    assert.throws(() => googleIdentity({ ...claims, ...changes }, "nonce"));
  }
});

test("Unknown Google email gets no user; known account retains its database identity and roles", async () => {
  const user = { id: "existing-id", email: "registered@example.com", roles: ["viewer"] };
  const lookup = async email => email === user.email ? user : null;
  assert.equal(await registeredGoogleUser("unknown@example.com", lookup), null);
  assert.equal(await registeredGoogleUser(user.email, lookup), user);
});

test("Configuration fails closed when credentials are absent", () => {
  const previous = process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_SECRET;
  try { assert.throws(() => googleConfig()); }
  finally { if (previous !== undefined) process.env.GOOGLE_CLIENT_SECRET = previous; }
});

test("Server verifies signature, issuer, audience, expiry and nonce", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const sign = (claims = {}) => new SignJWT({ sub: "google-user", email: "user@example.com", email_verified: true,
    nonce: "expected", iss: "https://accounts.google.com", aud: "client", exp: Math.floor(Date.now() / 1000) + 60,
    ...claims }).setProtectedHeader({ alg: "RS256" }).setIssuedAt().sign(privateKey);
  const token = await sign();
  assert.equal((await verifyGoogleToken(token, "client", "expected", publicKey)).email, "user@example.com");
  for (const claims of [{ iss: "https://attacker.example" }, { aud: "other-client" }, { exp: 1 }, { nonce: "wrong" }, { email_verified: false }]) {
    await assert.rejects(() => sign(claims).then(value => verifyGoogleToken(value, "client", "expected", publicKey)));
  }
  const wrongKey = await generateKeyPair("RS256");
  await assert.rejects(() => verifyGoogleToken(token, "client", "expected", wrongKey.publicKey));
});
