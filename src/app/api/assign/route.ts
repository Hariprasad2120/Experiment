import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendAssignmentNotification } from "@/lib/mail"

const assignSchema = z.object({
  appraisalId: z.string(),
  hrId: z.string(),
  tlId: z.string(),
  managerId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { appraisalId, hrId, tlId, managerId } = parsed.data

  const appraisal = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: { employee: true },
  })
  if (!appraisal) return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })

  // Upsert assignment
  const assignment = await prisma.assignment.upsert({
    where: { appraisalId },
    update: { hrId, tlId, managerId },
    create: { appraisalId, hrId, tlId, managerId },
    include: {
      hr: { select: { name: true, email: true } },
      tl: { select: { name: true, email: true } },
      manager: { select: { name: true, email: true } },
    },
  })

  // Update appraisal status
  await prisma.appraisal.update({
    where: { id: appraisalId },
    data: { status: "ASSIGNED" },
  })

  // Create availability records for evaluators
  const evaluators = [
    { id: hrId, role: "HR" },
    { id: tlId, role: "TL" },
    { id: managerId, role: "Manager" },
  ]

  for (const ev of evaluators) {
    await prisma.availability.upsert({
      where: { appraisalId_evaluatorId: { appraisalId, evaluatorId: ev.id } },
      update: {},
      create: { appraisalId, evaluatorId: ev.id, status: "PENDING" },
    })
  }

  // Send notifications
  const empName = appraisal.employee.name
  await sendAssignmentNotification(assignment.hr.email, assignment.hr.name, empName, "HR")
  await sendAssignmentNotification(assignment.tl.email, assignment.tl.name, empName, "TL")
  await sendAssignmentNotification(assignment.manager.email, assignment.manager.name, empName, "Manager")

  return NextResponse.json(assignment, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const appraisalId = searchParams.get("appraisalId")

  const assignment = await prisma.assignment.findFirst({
    where: appraisalId ? { appraisalId } : {},
    include: {
      hr: { select: { id: true, name: true, email: true } },
      tl: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(assignment)
}
