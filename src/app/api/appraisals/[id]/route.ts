import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateAverageRating, getVoteWinner } from "@/lib/utils"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const appraisal = await prisma.appraisal.findUnique({
    where: { id },
    include: {
      employee: true,
      assignment: {
        include: {
          hr: { select: { id: true, name: true, email: true, role: true } },
          tl: { select: { id: true, name: true, email: true, role: true } },
          manager: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      availabilities: { include: { evaluator: { select: { id: true, name: true, role: true } } } },
      ratings: { include: { evaluator: { select: { id: true, name: true, role: true } } } },
      votes: { include: { evaluator: { select: { id: true, name: true, role: true } } } },
      mom: { include: { createdBy: { select: { name: true } } } },
    },
  })

  if (!appraisal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const avgRating = calculateAverageRating(appraisal.ratings)
  const suggestedDate = getVoteWinner(appraisal.votes)

  return NextResponse.json({ ...appraisal, avgRating, suggestedDate })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const appraisal = await prisma.appraisal.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.finalDate && { finalDate: new Date(body.finalDate) }),
      ...(body.finalRating !== undefined && { finalRating: body.finalRating }),
    },
  })

  return NextResponse.json(appraisal)
}
