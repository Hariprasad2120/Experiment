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
import { RatingDisagreementForm } from "./rating-disagreement-form";
import { CheckCircle, Circle, ChevronRight, Star, FileText } from "lucide-react";
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

  const [existingReviews, existingDisagreement] = await Promise.all([
    myRating
      ? prisma.ratingReview.findMany({
          where: { ratingId: myRating.id },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    myRating
      ? prisma.ratingDisagreement.findFirst({ where: { ratingId: myRating.id } })
      : Promise.resolve(null),
  ]);

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
    <div className="space-y-5 max-w-2xl mx-auto">
      <FadeIn>
        <div className="flex items-center gap-3">
          <Link
            href="/reviewer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-foreground">
            {toTitleCase(cycle.user.name)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {cycle.type} Cycle · {cycle.user.department ?? "—"}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                Cycle Status
                {cycle.self && cycle.self.editCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <FileText className="size-3" />
                    Self-assessment edited {cycle.self.editCount}×
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
                  {displayStatus.replace(/_/g, " ")}
                </span>
                {visibleAverage !== null && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2.5 py-0.5 font-medium">
                    Avg: {visibleAverage.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!reviewOpen && (
              <p className="text-muted-foreground text-xs bg-muted rounded-xl p-3">
                Rating unlocks after employee submits self-assessment or the 3-business-day
                window expires.
              </p>
            )}
            {reviewOpen && !ratingOpen && (
              <p className="text-muted-foreground text-xs bg-muted rounded-xl p-3">
                Waiting for all assigned reviewers to confirm availability.
              </p>
            )}

            {/* Reviewer progress */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Reviewer Progress
              </p>
              {cycle.assignments.map((a) => {
                const rated = cycle.ratings.find((r) => r.role === a.role);
                const isMe = assignment?.role === a.role;
                const canSeeScores = !!myRating || session.user.role === "ADMIN";

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 py-1.5 rounded-xl px-2 hover:bg-muted/60 transition-colors"
                  >
                    {rated ? (
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-border shrink-0" />
                    )}
                    <span className="text-xs font-medium text-foreground w-16">{a.role}</span>
                    <span className="text-xs text-muted-foreground flex-1">
                      {toTitleCase(a.reviewer.name)}
                    </span>
                    {rated && canSeeScores && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {rated.averageScore.toFixed(2)}
                      </span>
                    )}
                    {rated && !canSeeScores && (
                      <span className="text-[10px] text-muted-foreground italic">
                        Submit yours to see
                      </span>
                    )}
                    {isMe && assignment?.availability === "PENDING" && (
                      <Link
                        href={`/reviewer/${cycleId}/availability`}
                        className="flex items-center gap-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-0.5 transition-colors"
                      >
                        Set availability <ChevronRight className="size-3" />
                      </Link>
                    )}
                    {isMe &&
                      assignment?.availability === "AVAILABLE" &&
                      ratingOpen &&
                      !myRating && (
                        <Link
                          href={`/reviewer/${cycleId}/rate`}
                          className="flex items-center gap-0.5 text-[10px] font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg px-2 py-0.5 transition-colors"
                        >
                          <Star className="size-3" /> Rate{" "}
                          <ChevronRight className="size-3" />
                        </Link>
                      )}
                    {isMe && myRating && (
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-0.5">
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

      {myRating && myCategoryScores.length > 0 && (
        <FadeIn delay={0.4}>
          <RatingDisagreementForm
            ratingId={myRating.id}
            cycleId={cycleId}
            categoryScores={myCategoryScores}
            existing={
              existingDisagreement
                ? {
                    evaluation: existingDisagreement.evaluation as "ACCURATE" | "OVERRATED" | "UNDERRATED",
                    comment: existingDisagreement.comment,
                    revisedScores: existingDisagreement.revisedScores as Record<string, number> | null,
                    ceilingMin: existingDisagreement.ceilingMin ? Number(existingDisagreement.ceilingMin) : null,
                    ceilingMax: existingDisagreement.ceilingMax ? Number(existingDisagreement.ceilingMax) : null,
                  }
                : null
            }
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
          <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            Extension request pending admin approval.
          </div>
        </FadeIn>
      )}
    </div>
  );
}
