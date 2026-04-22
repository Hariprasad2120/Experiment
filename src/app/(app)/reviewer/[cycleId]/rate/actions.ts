"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendEmail, rateCompletedEmail } from "@/lib/email";
import { isRatingOpen, syncCycleStatus } from "@/lib/workflow";

const schema = z.object({
  cycleId: z.string(),
  role: z.enum(["HR", "TL", "MANAGER"]),
  scores: z.record(z.string(), z.number()),
  comments: z.string().min(1),
  hasAverageOut: z.boolean().optional(),
});

type Result = { ok: true } | { ok: false; error: string };

export async function submitRatingAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { cycleId, role, scores, comments, hasAverageOut } = parsed.data;

  if (role === "TL" && hasAverageOut) {
    return { ok: false, error: "TLs cannot use Average Out" };
  }

  const assignment = await prisma.cycleAssignment.findFirst({
    where: { cycleId, reviewerId: session.user.id, role },
    include: {
      cycle: {
        include: {
          self: { select: { editableUntil: true, submittedAt: true, locked: true } },
          assignments: { select: { availability: true } },
        },
      },
    },
  });
  if (!assignment) return { ok: false, error: "Not assigned" };
  if (assignment.availability !== "AVAILABLE") return { ok: false, error: "Not available" };
  if (!isRatingOpen(assignment.cycle)) {
    return { ok: false, error: "Reviewing opens after self-assessment is submitted or the deadline passes" };
  }

  const existing = await prisma.rating.findFirst({ where: { cycleId, reviewerId: session.user.id } });
  if (existing) return { ok: false, error: "Already rated" };

  if (hasAverageOut) {
    const peerCount = await prisma.rating.count({ where: { cycleId } });
    if (peerCount === 0) return { ok: false, error: "Cannot Average Out — no peer has rated yet" };
  }

  const numericValues = Object.values(scores).filter((v) => v > 0);
  const avg = numericValues.length > 0 ? numericValues.reduce((s, v) => s + v, 0) / numericValues.length : 0;

  if (hasAverageOut) {
    const peerRatings = await prisma.rating.findMany({ where: { cycleId } });
    const peerAvg = peerRatings.reduce((s, r) => s + r.averageScore, 0) / peerRatings.length;
    const resolvedScores: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      resolvedScores[k] = v === -1 ? peerAvg : v;
    }
    const resolvedAvg =
      Object.values(resolvedScores).reduce((s, v) => s + v, 0) / Object.values(resolvedScores).length;

    await prisma.$transaction(async (tx) => {
      await tx.rating.create({
        data: { cycleId, reviewerId: session.user.id, role, scores: resolvedScores, averageScore: resolvedAvg, comments },
      });
      await tx.appraisalCycle.update({ where: { id: cycleId }, data: { status: "RATING_IN_PROGRESS" } });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.rating.create({
        data: { cycleId, reviewerId: session.user.id, role, scores, averageScore: avg, comments },
      });
      await tx.appraisalCycle.update({ where: { id: cycleId }, data: { status: "RATING_IN_PROGRESS" } });
    });
  }

  const otherAssignments = await prisma.cycleAssignment.findMany({
    where: { cycleId, reviewerId: { not: session.user.id } },
    include: { reviewer: true, cycle: { include: { user: true } } },
  });
  for (const oa of otherAssignments) {
    const mail = rateCompletedEmail({ otherReviewerName: oa.reviewer.name, employeeName: oa.cycle.user.name, ratedByRole: role });
    await sendEmail({ to: oa.reviewer.email, ...mail }).catch(() => {});
  }

  await syncCycleStatus(cycleId);
  revalidatePath(`/reviewer/${cycleId}`);
  revalidatePath("/reviewer");
  revalidatePath("/management");
  return { ok: true };
}

export async function addPostCommentAction(ratingId: string, postComment: string): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const rating = await prisma.rating.findUnique({ where: { id: ratingId } });
  if (!rating) return { ok: false, error: "Rating not found" };
  if (rating.reviewerId !== session.user.id) return { ok: false, error: "Forbidden" };
  if (!postComment.trim()) return { ok: false, error: "Comment cannot be empty" };

  await prisma.rating.update({ where: { id: ratingId }, data: { postComment } });
  revalidatePath(`/reviewer/${rating.cycleId}`);
  return { ok: true };
}
