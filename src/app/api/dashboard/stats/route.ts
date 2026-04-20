import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [
    totalEmployees,
    totalAppraisals,
    pendingAssignments,
    completed,
    inProgress,
    scheduled,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.appraisal.count(),
    prisma.appraisal.count({ where: { status: "PENDING" } }),
    prisma.appraisal.count({ where: { status: "COMPLETED" } }),
    prisma.appraisal.count({ where: { status: { in: ["ASSIGNED", "AVAILABILITY_PENDING", "RATING_IN_PROGRESS", "VOTING"] } } }),
    prisma.appraisal.count({ where: { status: "SCHEDULED" } }),
  ])

  return NextResponse.json({
    totalEmployees,
    totalAppraisals,
    pendingAssignments,
    completed,
    inProgress,
    scheduled,
  })
}
