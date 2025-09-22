import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { describeRole, validatePasscode, type UserRole } from "@/lib/auth/passcode";

const WINDOW_MS = 60_000;
const LIMIT = 10;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "global";
  const rate = rateLimit(`login:${ip}`, { windowMs: WINDOW_MS, limit: LIMIT });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const { role, passcode } = await request.json().catch(() => ({ }));
  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (!validatePasscode(role, passcode)) {
    return NextResponse.json({ error: `Incorrect ${describeRole(role)} passcode` }, { status: 401 });
  }

  const token = await createSessionToken(role, role);
  const response = NextResponse.json({ ok: true, role });
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    sameSite: "lax",
  });

  return response;
}
