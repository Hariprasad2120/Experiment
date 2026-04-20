import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { EvaluatorDashboard } from "@/components/dashboard/EvaluatorDashboard"

export default async function ManagerDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "MANAGER") redirect("/dashboard")
  return <EvaluatorDashboard role="Manager" userId={session.user.id} />
}
