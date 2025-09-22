import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken, type SessionTokenPayload } from "@/lib/auth/tokens";
import type { UserRole } from "@/lib/auth/passcode";

export async function getSession(): Promise<SessionTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session || session.role !== role) {
    redirect(role === "admin" ? "/admin/login" : "/volunteer/login");
  }
  return session;
}
