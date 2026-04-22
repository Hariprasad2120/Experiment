"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const schema = z.object({
  cycleId: z.string(),
  finalRating: z.number().min(0).max(5),
  slabId: z.string().optional(),
  finalAmount: z.number().min(0),
  comments: z.string().optional(),
});

type Result = { ok: true } | { ok: false; error: string };

export async function finalizeDecisionAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user || !["MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    return { ok: false, error: "Forbidden" };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { cycleId, finalRating, slabId, finalAmount, comments } = parsed.data;

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: { ratings: true },
  });
  if (!cycle) return { ok: false, error: "Cycle not found" };

  const avgRating = cycle.ratings.length > 0
    ? cycle.ratings.reduce((s, r) => s + r.averageScore, 0) / cycle.ratings.length
    : 0;

  await prisma.$transaction(async (tx) => {
    await tx.appraisalDecision.create({
      data: {
        cycleId,
        averagedRating: avgRating,
        finalRating,
        slabId: slabId ?? null,
        suggestedAmount: finalAmount,
        finalAmount,
        comments: comments ?? null,
        decidedById: session.user.id,
      },
    });
    await tx.appraisalCycle.update({
      where: { id: cycleId },
      data: { status: "DECIDED" },
    });
    await tx.notification.create({
      data: {
        userId: cycle.userId,
        type: "APPRAISAL_DECIDED",
        message: "Your appraisal decision has been finalized",
        link: "/employee",
      },
    });
  });

  revalidatePath("/management");
  revalidatePath(`/management/decide/${cycleId}`);
  revalidatePath("/employee");
  return { ok: true };
}
