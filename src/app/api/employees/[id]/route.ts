import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.string().min(1).optional(),
  joiningDate: z.string().optional(),
  userId: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      appraisals: {
        include: {
          assignment: {
            include: {
              hr: { select: { id: true, name: true, email: true } },
              tl: { select: { id: true, name: true, email: true } },
              manager: { select: { id: true, name: true, email: true } },
            },
          },
          availabilities: { include: { evaluator: { select: { name: true, role: true } } } },
          ratings: { include: { evaluator: { select: { name: true, role: true } } } },
          votes: true,
          mom: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(employee)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.joiningDate) data.joiningDate = new Date(parsed.data.joiningDate)

  const employee = await prisma.employee.update({ where: { id }, data })
  return NextResponse.json(employee)
}
