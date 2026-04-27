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
import { RatingReviewForm } from "./rating-review-form";
import { CheckCircle, Circle, ChevronRight, Star } from "lucide-react";
import { CRITERIA_CATEGORIES } from "@/lib/criteria";

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

  const existingReviews = myRating
    ? await prisma.ratingReview.findMany({
        where: { ratingId: myRating.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const myCategoryScores = myRating
    ? CRITERIA_CATEGORIES.map((cat) => ({
        name: cat.name,
        score: (myRating.scores as Record<string, number>)[cat.name] ?? 0,
        maxPoints: cat.maxPoints,
      })).filter((c) => (myRating.scores as Record<string, number>)[c.name] !== -1)
    : [];

  const visibleAverage =
    assignment && session.user.role !== "ADMIN"
      ? getVisibleAverageForReviewer(cycle.ratings, session.user.id)
      : cycle.ratings.length > 0
        ? cycle.ratings.reduce((sum, r) => sum + r.averageScore, 0) / cycle.ratings.length
        : null;

  return (
    <div className="space-y-5 max-w-2xl">
      <FadeIn>
        <div className="flex items-center gap-3">
          <Link href="/reviewer" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
        </div>
        <div className="mt-2">
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-500 font-normal">Cycle Status</CardTitle>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
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

            {/* Reviewer progress with inline actions */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Reviewer Progress</p>
              {cycle.assignments.map((a) => {
                const rated = cycle.ratings.find((r) => r.role === a.role);
                const isMe = assignment?.role === a.role;
                const canSeeScores = !!myRating || session.user.role === "ADMIN";

                return (
                  <div key={a.id} className="flex items-center gap-2 py-1 rounded-lg px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {rated ? (
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-slate-300 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-16">{a.role}</span>
                    <span className="text-xs text-slate-500 flex-1">{toTitleCase(a.reviewer.name)}</span>
                    {rated && canSeeScores && (
                      <span className="text-xs text-green-600 font-medium">{rated.averageScore.toFixed(2)}</span>
                    )}
                    {rated && !canSeeScores && (
                      <span className="text-[10px] text-slate-400 italic">Submit yours to see</span>
                    )}
                    {/* Inline availability action for this reviewer */}
                    {isMe && assignment?.availability === "PENDING" && (
                      <Link
                        href={`/reviewer/${cycleId}/availability`}
                        className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md px-2 py-0.5 transition-colors"
                      >
                        Set availability <ChevronRight className="size-3" />
                      </Link>
                    )}
                    {/* Inline rate action */}
                    {isMe && assignment?.availability === "AVAILABLE" && ratingOpen && !myRating && (
                      <Link
                        href={`/reviewer/${cycleId}/rate`}
                        className="flex items-center gap-0.5 text-[10px] font-medium text-[#008993] bg-[#008993]/10 hover:bg-[#008993]/20 border border-[#008993]/20 rounded-md px-2 py-0.5 transition-colors"
                      >
                        <Star className="size-3" /> Rate <ChevronRight className="size-3" />
                      </Link>
                    )}
                    {isMe && myRating && (
                      <span className="text-[10px] text-green-600 font-medium bg-green-50 rounded-md px-2 py-0.5">
                        ✓ Submitted
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {myRating && (
        <FadeIn delay={0.3}>
          <PostCommentForm ratingId={myRating.id} existingComment={myRating.postComment ?? null} />
        </FadeIn>
      )}

      {myRating && myCategoryScores.length > 0 && (
        <FadeIn delay={0.35}>
          <RatingReviewForm
            ratingId={myRating.id}
            cycleId={cycleId}
            categoryScores={myCategoryScores}
            existingReviews={existingReviews.map((r) => ({
              criteriaName: r.criteriaName,
              revisedScore: r.revisedScore,
              justification: r.justification,
              updatedAt: r.updatedAt.toISOString(),
            }))}
          />
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
