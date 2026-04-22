import { prisma } from "@/lib/db";
import type { CycleStatus, ReviewerAvailability } from "@/generated/prisma/enums";

type WorkflowAssignment = {
  availability: ReviewerAvailability;
};

type WorkflowRating = {
  averageScore: number;
  reviewerId: string;
};

type WorkflowSelf = {
  editableUntil: Date;
  submittedAt: Date | null;
  locked: boolean;
} | null;

type WorkflowCycle = {
  id: string;
  status: CycleStatus;
  self: WorkflowSelf;
  assignments: WorkflowAssignment[];
  ratings: WorkflowRating[];
};

export function isSelfAssessmentSubmitted(self: WorkflowSelf): boolean {
  return Boolean(self?.submittedAt);
}

export function isSelfAssessmentWindowExpired(self: WorkflowSelf, now = new Date()): boolean {
  if (!self) return false;
  return now > self.editableUntil;
}

export function isReviewWindowOpen(cycle: Pick<WorkflowCycle, "self">, now = new Date()): boolean {
  return isSelfAssessmentSubmitted(cycle.self) || isSelfAssessmentWindowExpired(cycle.self, now);
}

export function hasPendingAvailability(assignments: WorkflowAssignment[] = []): boolean {
  return assignments.some((assignment) => assignment.availability === "PENDING");
}

export function isRatingOpen(
  cycle: Pick<WorkflowCycle, "self" | "assignments">,
  now = new Date(),
): boolean {
  return isReviewWindowOpen(cycle, now) && !hasPendingAvailability(cycle.assignments);
}

export function getVisibleAverageForReviewer(
  ratings: WorkflowRating[],
  reviewerId: string,
): number | null {
  const reviewerHasRated = ratings.some((rating) => rating.reviewerId === reviewerId);
  if (!reviewerHasRated || ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating.averageScore, 0) / ratings.length;
}

export function computeCycleStatus(cycle: WorkflowCycle, now = new Date()): CycleStatus {
  if (cycle.status === "DECIDED" || cycle.status === "CLOSED" || cycle.status === "SCHEDULED") {
    return cycle.status;
  }

  const availableAssignments = cycle.assignments.filter(
    (assignment) => assignment.availability === "AVAILABLE",
  );

  if (availableAssignments.length > 0 && cycle.ratings.length >= availableAssignments.length) {
    return "RATINGS_COMPLETE";
  }

  if (cycle.ratings.length > 0) {
    return "RATING_IN_PROGRESS";
  }

  if (!isReviewWindowOpen(cycle, now)) {
    return isSelfAssessmentSubmitted(cycle.self) ? "SELF_SUBMITTED" : "PENDING_SELF";
  }

  return "AWAITING_AVAILABILITY";
}

export async function syncCycleStatus(cycleId: string, now = new Date()): Promise<CycleStatus | null> {
  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      self: {
        select: {
          editableUntil: true,
          submittedAt: true,
          locked: true,
        },
      },
      assignments: {
        select: {
          availability: true,
        },
      },
      ratings: {
        select: {
          averageScore: true,
          reviewerId: true,
        },
      },
    },
  });

  if (!cycle) return null;

  const nextStatus = computeCycleStatus(cycle, now);
  if (cycle.status !== nextStatus) {
    await prisma.appraisalCycle.update({
      where: { id: cycleId },
      data: { status: nextStatus },
    });
  }

  return nextStatus;
}
