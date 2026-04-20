import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  employeeId: z.string(),
  cycleMonth: z.number().int().min(1).max(12),
  cycleYear: z.number().int().min(2020),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")
  const status = searchParams.get("status")
  const employeeId = searchParams.get("employeeId")

  const role = session.user.role
  const userId = session.user.id

  // Build where clause based on role
  type WhereClause = Record<string, unknown>
  const where: WhereClause = {}
  if (month) where.cycleMonth = parseInt(month)
  if (year) where.cycleYear = parseInt(year)
  if (status) where.status = status
  if (employeeId) where.employeeId = employeeId

  // Evaluators only see their assigned appraisals
  if (["HR", "TL", "MANAGER"].includes(role)) {
    where.assignment = {
      OR: [{ hrId: userId }, { tlId: userId }, { managerId: userId }],
    }
  }

  // Employees only see their own appraisals
  if (role === "EMPLOYEE") {
    const employee = await prisma.employee.findFirst({ where: { userId } })
    if (!employee) return NextResponse.json([])
    where.employeeId = employee.id
  }

  const appraisals = await prisma.appraisal.findMany({
    where,
    include: {
      employee: { select: { id: true, empId: true, name: true, department: true } },
      assignment: {
        include: {
          hr: { select: { id: true, name: true } },
          tl: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
        },
      },
      availabilities: { select: { evaluatorId: true, status: true, isLocked: true } },
      ratings: { select: { evaluatorId: true, overallRating: true, isLocked: true } },
      votes: { select: { evaluatorId: true, selectedDate: true } },
      mom: { select: { id: true, finalRating: true, increment: true } },
    },
    orderBy: [{ cycleYear: "desc" }, { cycleMonth: "desc" }],
  })

  return NextResponse.json(appraisals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { employeeId, cycleMonth, cycleYear } = parsed.data
  const existing = await prisma.appraisal.findUnique({
    where: { employeeId_cycleMonth_cycleYear: { employeeId, cycleMonth, cycleYear } },
  })
  if (existing) {
    return NextResponse.json({ error: "Appraisal already exists for this cycle" }, { status: 409 })
  }

  const appraisal = await prisma.appraisal.create({
    data: { employeeId, cycleMonth, cycleYear, status: "PENDING" },
    include: { employee: { select: { name: true, empId: true } } },
  })

  return NextResponse.json(appraisal, { status: 201 })
}
