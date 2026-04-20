import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  empId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  joiningDate: z.string(),
  userId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const department = searchParams.get("department")
  const search = searchParams.get("search")

  const employees = await prisma.employee.findMany({
    where: {
      ...(department ? { department } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { empId: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, role: true } },
      appraisals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { assignment: { include: { hr: { select: { name: true } }, tl: { select: { name: true } }, manager: { select: { name: true } } } } },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(employees)
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

  const existing = await prisma.employee.findFirst({
    where: { OR: [{ empId: parsed.data.empId }, { email: parsed.data.email }] },
  })
  if (existing) {
    return NextResponse.json({ error: "Employee ID or email already exists" }, { status: 409 })
  }

  const employee = await prisma.employee.create({
    data: {
      ...parsed.data,
      joiningDate: new Date(parsed.data.joiningDate),
    },
  })

  return NextResponse.json(employee, { status: 201 })
}
