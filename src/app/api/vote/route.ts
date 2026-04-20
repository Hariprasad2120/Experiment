import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getVoteWinner } from "@/lib/utils"
import { sendAppraisalScheduled } from "@/lib/mail"
import { formatDate } from "@/lib/utils"

const voteSchema = z.object({
  appraisalId: z.string(),
  selectedDate: z.string(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const appraisalId = searchParams.get("appraisalId")
  if (!appraisalId) return NextResponse.json({ error: "appraisalId required" }, { status: 400 })

  const votes = await prisma.vote.findMany({
    where: { appraisalId },
    include: { evaluator: { select: { id: true, name: true, role: true } } },
  })

  const winner = getVoteWinner(votes)
  return NextResponse.json({ votes, suggestedDate: winner })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !["HR", "TL", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { appraisalId, selectedDate } = parsed.data
  const evaluatorId = session.user.id

  const vote = await prisma.vote.upsert({
    where: { appraisalId_evaluatorId: { appraisalId, evaluatorId } },
    update: { selectedDate: new Date(selectedDate) },
    create: { appraisalId, evaluatorId, selectedDate: new Date(selectedDate) },
  })

  // Check if all evaluators voted → schedule appraisal
  const appraisal = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: {
      assignment: true,
      votes: true,
      employee: true,
    },
  })

  if (appraisal?.assignment) {
    const evaluatorIds = [appraisal.assignment.hrId, appraisal.assignment.tlId, appraisal.assignment.managerId]
    const votedIds = appraisal.votes.map((v: { evaluatorId: string }) => v.evaluatorId)
    const allVoted = evaluatorIds.every((id) => votedIds.includes(id))

    if (allVoted) {
      const winner = getVoteWinner(appraisal.votes)
      await prisma.appraisal.update({
        where: { id: appraisalId },
        data: { status: "SCHEDULED", finalDate: winner ?? undefined },
      })
      if (winner && appraisal.employee.email) {
        await sendAppraisalScheduled(
          appraisal.employee.email,
          appraisal.employee.name,
          formatDate(winner)
        )
      }
    }
  }

  return NextResponse.json(vote, { status: 201 })
}
