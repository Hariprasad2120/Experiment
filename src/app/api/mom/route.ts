import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendMOMCreated } from "@/lib/mail"

const momSchema = z.object({
  appraisalId: z.string(),
  content: z.string().min(1),
  finalRating: z.number().min(0).max(10).optional(),
  increment: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const appraisalId = searchParams.get("appraisalId")

  const mom = await prisma.mOM.findFirst({
    where: appraisalId ? { appraisalId } : {},
    include: {
      createdBy: { select: { name: true } },
      appraisal: { include: { employee: { select: { name: true, empId: true } } } },
    },
  })

  return NextResponse.json(mom)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = momSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { appraisalId, content, finalRating, increment } = parsed.data

  const mom = await prisma.mOM.upsert({
    where: { appraisalId },
    update: { content, finalRating: finalRating ?? null, increment: increment ?? null },
    create: {
      appraisalId,
      content,
      finalRating: finalRating ?? null,
      increment: increment ?? null,
      createdById: session.user.id,
    },
  })

  // Mark appraisal as completed
  const appraisal = await prisma.appraisal.update({
    where: { id: appraisalId },
    data: {
      status: "COMPLETED",
      ...(finalRating !== undefined && { finalRating }),
    },
    include: { employee: true },
  })

  await sendMOMCreated(appraisal.employee.email, appraisal.employee.name)

  return NextResponse.json(mom, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, content, finalRating, increment } = body

  const mom = await prisma.mOM.update({
    where: { id },
    data: { content, finalRating, increment },
  })

  return NextResponse.json(mom)
}
