import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/tokens";

const ADMIN_LOGIN = "/admin/login";
const VOLUNTEER_LOGIN = "/volunteer/login";
const PROTECTED_PREFIXES = ["/admin", "/volunteer"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminLogin = pathname === ADMIN_LOGIN;
  const isVolunteerLogin = pathname === VOLUNTEER_LOGIN;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token && (isAdminLogin || isVolunteerLogin)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(
      new URL(pathname.startsWith("/admin") ? ADMIN_LOGIN : VOLUNTEER_LOGIN, request.url)
    );
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const response = NextResponse.redirect(
      new URL(pathname.startsWith("/admin") ? ADMIN_LOGIN : VOLUNTEER_LOGIN, request.url)
    );
    response.cookies.set({ name: SESSION_COOKIE, value: "", maxAge: 0, path: "/" });
    return response;
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(VOLUNTEER_LOGIN, request.url));
  }

  if (pathname.startsWith("/volunteer") && session.role !== "volunteer") {
    return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
  }

  if (isAdminLogin || isVolunteerLogin) {
    return NextResponse.redirect(new URL(session.role === "admin" ? "/admin" : "/volunteer", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/volunteer/:path*"],
};
