"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { syncCycleStatus } from "@/lib/workflow";

const schema = z.object({
  cycleId: z.string(),
  answers: z.record(z.string(), z.any()),
});

type Result = { ok: true; editableUntil: string } | { ok: false; error: string };

export async function submitSelfAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: parsed.data.cycleId },
    include: {
      self: true,
      assignments: { include: { reviewer: { select: { id: true, name: true } } } },
      user: { select: { name: true } },
    },
  });
  if (!cycle || cycle.userId !== session.user.id) return { ok: false, error: "Forbidden" };
  if (!cycle.self) return { ok: false, error: "No self-assessment record" };
  if (cycle.self.locked) return { ok: false, error: "Locked" };
  if (new Date() > cycle.self.editableUntil) return { ok: false, error: "Edit window closed" };

  const isFirstSubmission = !cycle.self.submittedAt;
  const newEditCount = cycle.self.editCount + (isFirstSubmission ? 0 : 1);

  await prisma.$transaction(async (tx) => {
    await tx.selfAssessment.update({
      where: { cycleId: parsed.data.cycleId },
      data: {
        answers: parsed.data.answers,
        submittedAt: new Date(),
        editCount: newEditCount,
      },
    });
    await tx.appraisalCycle.update({
      where: { id: parsed.data.cycleId },
      data: { status: "SELF_SUBMITTED" },
    });
  });

  // Notify reviewers + all admins that self-assessment was submitted
  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true },
  });
  const reviewerIds = cycle.assignments.map((a) => a.reviewer.id);
  const notifyUserIds = [...new Set([...reviewerIds, ...adminUsers.map((u) => u.id)])];
  const employeeName = cycle.user.name;

  await Promise.all(
    notifyUserIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: "SELF_ASSESSMENT_SUBMITTED",
          message: `${employeeName} has submitted their self-assessment.`,
          link: `/reviewer/${parsed.data.cycleId}`,
          persistent: true,
        },
      })
    )
  );

  await syncCycleStatus(parsed.data.cycleId);
  revalidatePath("/employee");
  return { ok: true, editableUntil: cycle.self.editableUntil.toISOString() };
}
