import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET env var is required");
  }
  return encoder.encode(secret);
}

export type SessionTokenPayload = {
  sub: string;
  role: "admin" | "volunteer";
  iat: number;
  exp: number;
};

const SESSION_COOKIE = "bloodsync_token";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export async function createSessionToken(role: SessionTokenPayload["role"], subject: string) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.role !== "string" || typeof payload.sub !== "string") {
      return null;
    }
    return {
      role: payload.role as SessionTokenPayload["role"],
      sub: payload.sub,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch (error) {
    console.warn("Failed to verify session token", error);
    return null;
  }
}

export { SESSION_COOKIE, SESSION_TTL_SECONDS };
