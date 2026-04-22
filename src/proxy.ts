import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessPath, ROLE_HOME } from "@/lib/rbac";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/logo"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/" || pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[session.user.role];
    return NextResponse.redirect(url);
  }

  if (!canAccessPath(session.user.role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[session.user.role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
