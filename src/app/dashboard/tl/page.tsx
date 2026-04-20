import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { EvaluatorDashboard } from "@/components/dashboard/EvaluatorDashboard"

export default async function TLDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "TL") redirect("/dashboard")
  return <EvaluatorDashboard role="TL" userId={session.user.id} />
}
