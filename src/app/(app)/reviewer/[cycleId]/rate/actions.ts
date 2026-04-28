"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendEmail, rateCompletedEmail } from "@/lib/email";
import { isRatingOpen, syncCycleStatus } from "@/lib/workflow";
import { CRITERIA_CATEGORIES, getCriteriaForRole } from "@/lib/criteria";

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

  // Normalize: sum of category scores / role-specific max * 100
  const roleCategories = getCriteriaForRole(CRITERIA_CATEGORIES, role);
  const roleTotalMaxPoints = roleCategories.reduce((s, c) => s + c.maxPoints, 0);
  const numericValues = Object.values(scores).filter((v) => v > 0);
  const rawSum = numericValues.reduce((s, v) => s + v, 0);
  const avg = (rawSum / roleTotalMaxPoints) * 100;

  if (hasAverageOut) {
    const peerRatings = await prisma.rating.findMany({ where: { cycleId } });
    const peerAvgNormalized = peerRatings.reduce((s, r) => s + r.averageScore, 0) / peerRatings.length;
    // For each averaged-out criterion, substitute peer's normalized % of THAT criterion's max points
    const catMaxByName = new Map(roleCategories.map((c) => [c.name, c.maxPoints]));
    const resolvedScores: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      if (v === -1) {
        const catMax = catMaxByName.get(k) ?? 0;
        resolvedScores[k] = (peerAvgNormalized / 100) * catMax;
      } else {
        resolvedScores[k] = v;
      }
    }
    const resolvedRawSum = Object.values(resolvedScores).reduce((s, v) => s + v, 0);
    const resolvedAvg = (resolvedRawSum / roleTotalMaxPoints) * 100;

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

  const cycleWithUser = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      user: { select: { id: true, name: true } },
      assignments: { include: { reviewer: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (cycleWithUser) {
    const otherReviewers = cycleWithUser.assignments
      .map((a) => a.reviewer)
      .filter((r) => r.id !== session.user.id);

    // Email other reviewers
    for (const r of otherReviewers) {
      const mail = rateCompletedEmail({ otherReviewerName: r.name, employeeName: cycleWithUser.user.name, ratedByRole: role });
      await sendEmail({ to: r.email, ...mail }).catch(() => {});
    }

    // Popup notifications: admin + management + employee
    const [adminUsers, managementUsers] = await Promise.all([
      prisma.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } }),
      prisma.user.findMany({ where: { role: "MANAGEMENT", active: true }, select: { id: true } }),
    ]);
    const notifyIds = [
      ...new Set([
        ...adminUsers.map((u) => u.id),
        ...managementUsers.map((u) => u.id),
        cycleWithUser.user.id,
      ]),
    ];
    await Promise.all(
      notifyIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            type: "RATING_SUBMITTED",
            message: `${role} reviewer has submitted their rating for ${cycleWithUser.user.name}'s appraisal.`,
            link: userId === cycleWithUser.user.id ? "/employee" : `/management/decide/${cycleId}`,
            persistent: false,
          },
        })
      )
    );
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
