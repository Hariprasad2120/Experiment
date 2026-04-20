import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { calculateAverageRating } from "@/lib/utils"

const criterionSchema = z.object({
  name: z.string(),
  score: z.number().min(1).max(10),
})

const ratingSchema = z.object({
  appraisalId: z.string(),
  criteria: z.array(criterionSchema).min(1),
  overallRating: z.number().min(1).max(10),
  comment: z.string().optional(),
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

  const ratings = await prisma.rating.findMany({
    where,
    include: { evaluator: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(ratings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["HR", "TL", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = ratingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { appraisalId, criteria, overallRating, comment } = parsed.data
  const evaluatorId = session.user.id

  const existing = await prisma.rating.findUnique({
    where: { appraisalId_evaluatorId: { appraisalId, evaluatorId } },
  })
  if (existing?.isLocked) {
    return NextResponse.json({ error: "Rating already submitted and locked" }, { status: 403 })
  }

  const rating = await prisma.rating.upsert({
    where: { appraisalId_evaluatorId: { appraisalId, evaluatorId } },
    update: { criteria, overallRating, comment: comment ?? null, isLocked: true },
    create: { appraisalId, evaluatorId, criteria, overallRating, comment: comment ?? null, isLocked: true },
  })

  // Check if all evaluators submitted ratings → move to voting
  const appraisal = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: {
      assignment: true,
      ratings: { select: { overallRating: true } },
    },
  })

  if (appraisal?.assignment) {
    const evaluatorIds = [appraisal.assignment.hrId, appraisal.assignment.tlId, appraisal.assignment.managerId]
    const submittedIds = (
      await prisma.rating.findMany({ where: { appraisalId }, select: { evaluatorId: true } })
    ).map((r: { evaluatorId: string }) => r.evaluatorId)

    const allSubmitted = evaluatorIds.every((id) => submittedIds.includes(id))
    if (allSubmitted) {
      const avg = calculateAverageRating(appraisal.ratings)
      await prisma.appraisal.update({
        where: { id: appraisalId },
        data: { status: "VOTING", finalRating: avg ?? undefined },
      })
    }
  }

  return NextResponse.json(rating, { status: 201 })
}
