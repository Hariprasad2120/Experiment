"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { syncCycleStatus } from "@/lib/workflow";

const schema = z.object({
  cycleId: z.string(),
  answers: z.record(z.string(), z.string().min(1)),
});

type Result = { ok: true } | { ok: false; error: string };

export async function submitSelfAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: parsed.data.cycleId },
    include: { self: true },
  });
  if (!cycle || cycle.userId !== session.user.id) return { ok: false, error: "Forbidden" };
  if (!cycle.self) return { ok: false, error: "No self-assessment record" };
  if (cycle.self.locked) return { ok: false, error: "Locked" };
  if (new Date() > cycle.self.editableUntil) return { ok: false, error: "Edit window closed" };

  await prisma.$transaction(async (tx) => {
    await tx.selfAssessment.update({
      where: { cycleId: parsed.data.cycleId },
      data: {
        answers: parsed.data.answers,
        submittedAt: new Date(),
      },
    });
    await tx.appraisalCycle.update({
      where: { id: parsed.data.cycleId },
      data: { status: "SELF_SUBMITTED" },
    });
  });

  await syncCycleStatus(parsed.data.cycleId);
  revalidatePath("/employee");
  return { ok: true };
}
