import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ["/login", "/api/auth"]
const ROLE_PATHS: Record<string, string[]> = {
  ADMIN: ["/dashboard/admin"],
  HR: ["/dashboard/hr"],
  TL: ["/dashboard/tl"],
  MANAGER: ["/dashboard/manager"],
  EMPLOYEE: ["/dashboard/employee"],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = session.user.role
  for (const [r, paths] of Object.entries(ROLE_PATHS)) {
    if (r !== role && paths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
