import { auth } from "@/auth"
import { redirect } from "next/navigation"

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  HR: "/dashboard/hr",
  TL: "/dashboard/tl",
  MANAGER: "/dashboard/manager",
  EMPLOYEE: "/dashboard/employee",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  redirect(ROLE_REDIRECT[session.user.role] ?? "/dashboard/employee")
}
