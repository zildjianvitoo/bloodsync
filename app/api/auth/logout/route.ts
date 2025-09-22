import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/tokens";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
