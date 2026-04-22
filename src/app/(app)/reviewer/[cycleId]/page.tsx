import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeCycleStatus,
  getVisibleAverageForReviewer,
  isRatingOpen,
  isReviewWindowOpen,
} from "@/lib/workflow";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import { ExtensionRequestForm } from "./extension-request-form";
import { PostCommentForm } from "./post-comment-form";
import { CheckCircle, Circle } from "lucide-react";

export default async function ReviewerCycleView({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const assignment = await prisma.cycleAssignment.findFirst({
    where: { cycleId, reviewerId: session.user.id },
  });
  if (!assignment && session.user.role !== "ADMIN") notFound();

  const [cycle, existingExtension] = await Promise.all([
    prisma.appraisalCycle.findUnique({
      where: { id: cycleId },
      include: {
        user: true,
        self: true,
        ratings: { include: { reviewer: { select: { name: true } } } },
        assignments: { include: { reviewer: { select: { name: true } } } },
      },
    }),
    assignment
      ? prisma.extensionRequest.findFirst({
          where: { cycleId, requesterId: session.user.id, status: "PENDING" },
        })
      : null,
  ]);
  if (!cycle) notFound();

  const reviewOpen = isReviewWindowOpen(cycle);
  const ratingOpen = isRatingOpen(cycle);
  const displayStatus = computeCycleStatus(cycle);
  const myRating = cycle.ratings.find((r) => r.reviewerId === session.user.id);
  const visibleAverage =
    assignment && session.user.role !== "ADMIN"
      ? getVisibleAverageForReviewer(cycle.ratings, session.user.id)
      : cycle.ratings.length > 0
        ? cycle.ratings.reduce((sum, r) => sum + r.averageScore, 0) / cycle.ratings.length
        : null;

  return (
    <div className="space-y-5 max-w-2xl">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {toTitleCase(cycle.user.name)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {cycle.type} Cycle · {cycle.user.department ?? "—"}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-normal">Cycle Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 font-medium">
                {displayStatus.replace(/_/g, " ")}
              </span>
              {visibleAverage !== null && (
                <span className="text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 font-medium">
                  Avg: {visibleAverage.toFixed(2)}
                </span>
              )}
            </div>

            {!reviewOpen && (
              <p className="text-slate-500 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                Rating unlocks after employee submits self-assessment or the 3-business-day window expires.
              </p>
            )}
            {reviewOpen && !ratingOpen && (
              <p className="text-slate-500 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                Waiting for all assigned reviewers to confirm availability.
              </p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reviewer Progress</p>
              {cycle.assignments.map((a) => {
                const rated = cycle.ratings.find((r) => r.role === a.role);
                return (
                  <div key={a.id} className="flex items-center gap-2">
                    {rated ? (
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-slate-300 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-16">{a.role}</span>
                    <span className="text-xs text-slate-500">{toTitleCase(a.reviewer.name)}</span>
                    {rated && (
                      <span className="ml-auto text-xs text-green-600 font-medium">{rated.averageScore.toFixed(2)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3">
          {assignment?.availability === "PENDING" && (
            <Link
              href={`/reviewer/${cycleId}/availability`}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Set Availability
            </Link>
          )}
          {assignment?.availability === "AVAILABLE" && ratingOpen && !myRating && (
            <Link
              href={`/reviewer/${cycleId}/rate`}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Rate Employee
            </Link>
          )}
          {myRating && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <CheckCircle className="size-4" /> Rating submitted ({myRating.averageScore.toFixed(2)})
            </span>
          )}
          <Link href="/reviewer" className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
            ← Back
          </Link>
        </div>
      </FadeIn>

      {myRating && (
        <FadeIn delay={0.3}>
          <PostCommentForm ratingId={myRating.id} existingComment={myRating.postComment ?? null} />
        </FadeIn>
      )}

      {assignment && !myRating && ratingOpen && !existingExtension && (
        <FadeIn delay={0.3}>
          <ExtensionRequestForm cycleId={cycleId} />
        </FadeIn>
      )}

      {existingExtension && (
        <FadeIn delay={0.3}>
          <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            Extension request pending admin approval.
          </div>
        </FadeIn>
      )}
    </div>
  );
}
