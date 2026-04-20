import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const availabilitySchema = z.object({
  appraisalId: z.string(),
  status: z.enum(["AVAILABLE", "NOT_AVAILABLE"]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const appraisalId = searchParams.get("appraisalId")

  const where: Record<string, unknown> = {}
  if (appraisalId) where.appraisalId = appraisalId
  if (["HR", "TL", "MANAGER"].includes(session.user.role)) {
    where.evaluatorId = session.user.id
  }

  const availabilities = await prisma.availability.findMany({
    where,
    include: { evaluator: { select: { id: true, name: true, role: true } } },
  })

  return NextResponse.json(availabilities)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["HR", "TL", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = availabilitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { appraisalId, status } = parsed.data
  const evaluatorId = session.user.id

  // Check if already locked
  const existing = await prisma.availability.findUnique({
    where: { appraisalId_evaluatorId: { appraisalId, evaluatorId } },
  })

  if (existing?.isLocked) {
    return NextResponse.json({ error: "Availability already submitted and locked" }, { status: 403 })
  }

  const availability = await prisma.availability.upsert({
    where: { appraisalId_evaluatorId: { appraisalId, evaluatorId } },
    update: { status, isLocked: true },
    create: { appraisalId, evaluatorId, status, isLocked: true },
  })

  // Check if all 3 evaluators submitted availability
  const allAvailabilities = await prisma.availability.findMany({
    where: { appraisalId },
  })

  const allSubmitted = allAvailabilities.every((a: { status: string }) => a.status !== "PENDING")
  const anyUnavailable = allAvailabilities.some((a: { status: string }) => a.status === "NOT_AVAILABLE")

  if (allSubmitted && !anyUnavailable) {
    await prisma.appraisal.update({
      where: { id: appraisalId },
      data: { status: "RATING_IN_PROGRESS" },
    })
  } else if (allSubmitted) {
    await prisma.appraisal.update({
      where: { id: appraisalId },
      data: { status: "AVAILABILITY_PENDING" },
    })
  }

  return NextResponse.json(availability)
}

export async function PUT(req: NextRequest) {
  // Admin override
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, status } = body

  const availability = await prisma.availability.update({
    where: { id },
    data: { status, isLocked: false },
  })

  return NextResponse.json(availability)
}
