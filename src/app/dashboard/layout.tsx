import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SideBar from "@/components/sidebar/SideBar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar
        role={session.user.role}
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
