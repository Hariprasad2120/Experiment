import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { EvaluatorDashboard } from "@/components/dashboard/EvaluatorDashboard"

export default async function HRDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "HR") redirect("/dashboard")
  return <EvaluatorDashboard role="HR" userId={session.user.id} />
}
