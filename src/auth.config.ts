import type { NextAuthConfig } from "next-auth"

// Edge-safe config — NO Prisma / pg imports here (used by middleware)
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as { role?: string }).role ?? "EMPLOYEE"
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
}
