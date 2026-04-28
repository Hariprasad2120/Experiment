import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { DecisionForm } from "./decision-form";
import { CheckCircle, FileText } from "lucide-react";
import { CRITERIA_CATEGORIES, getCriteriaForRole } from "@/lib/criteria";

export default async function DecidePage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      user: { include: { salary: true } },
      self: true,
      ratings: {
        include: {
          reviewer: { select: { name: true, role: true } },
          ratingReviews: true,
          disagreement: true,
        },
      },
      decision: { include: { slab: true } },
      assignments: { include: { reviewer: { select: { name: true } } } },
      ratingReviews: {
        include: { reviewer: { select: { name: true, role: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!cycle) notFound();

  const slabs = await prisma.incrementSlab.findMany({ orderBy: { minRating: "desc" } });

  const avg = cycle.ratings.length > 0
    ? cycle.ratings.reduce((s, r) => s + r.averageScore, 0) / cycle.ratings.length
    : 0;

  const suggestedSlab = slabs.find((s) => avg >= s.minRating && avg <= s.maxRating);
  const grossAnnum = cycle.user.salary ? Number(cycle.user.salary.grossAnnum) : 0;

  // Build per-reviewer rating data with criteria breakdown
  const reviewerRatings = cycle.ratings.map((r) => {
    const scores = r.scores as Record<string, number>;
    const criteriaBreakdown = CRITERIA_CATEGORIES.map((cat) => ({
      name: cat.name,
      maxPoints: cat.maxPoints,
      score: scores[cat.name] ?? 0,
      revisedScore: r.ratingReviews.find((rv) => rv.criteriaName === cat.name)?.revisedScore ?? null,
      justification: r.ratingReviews.find((rv) => rv.criteriaName === cat.name)?.justification ?? null,
    }));
    return {
      id: r.id,
      role: r.role,
      reviewerName: toTitleCase(r.reviewer.name),
      averageScore: r.averageScore,
      comments: r.comments,
      postComment: r.postComment,
      criteriaBreakdown,
      hasRevisions: r.ratingReviews.length > 0,
      disagreement: r.disagreement
        ? {
            evaluation: r.disagreement.evaluation as string,
            comment: r.disagreement.comment,
            ceilingMin: r.disagreement.ceilingMin ? Number(r.disagreement.ceilingMin) : null,
            ceilingMax: r.disagreement.ceilingMax ? Number(r.disagreement.ceilingMax) : null,
            revisedScores: r.disagreement.revisedScores as Record<string, number> | null,
          }
        : null,
    };
  });

  // Self-assessment answers for display
  const selfAnswers = cycle.self?.answers as Record<string, { score: number; comment: string }> | null;

  // Criteria management can rate (excludes Accountability & Attendance, Organisational Contribution & Engagement)
  const mgmtCriteria = getCriteriaForRole(CRITERIA_CATEGORIES, "MANAGEMENT");

  return (
    <div className="space-y-5 max-w-5xl">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Finalize: {toTitleCase(cycle.user.name)}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 text-sm">
              {cycle.type} Appraisal · {cycle.user.department ?? "—"}
            </p>
            {cycle.self && cycle.self.editCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <FileText className="size-3" />
                Self-assessment edited {cycle.self.editCount}×
              </span>
            )}
          </div>
        </div>
      </FadeIn>

      {cycle.decision ? (
        <FadeIn delay={0.1}>
          <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle className="size-4" /> Appraisal Decided
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <div className="text-slate-500">Final Rating</div>
                <div className="font-semibold">{cycle.decision.finalRating.toFixed(2)}</div>
                <div className="text-slate-500">Hike %</div>
                <div className="font-semibold">{cycle.decision.slab?.hikePercent ?? "—"}%</div>
                <div className="text-slate-500">Final Increment</div>
                <div className="font-semibold text-green-600">₹{Number(cycle.decision.finalAmount).toLocaleString()}/yr</div>
                <div className="text-slate-500">Current Gross</div>
                <div className="font-semibold">₹{grossAnnum.toLocaleString()}/yr</div>
                <div className="text-slate-500">New Gross</div>
                <div className="font-semibold text-blue-600">₹{(grossAnnum + Number(cycle.decision.finalAmount)).toLocaleString()}/yr</div>
              </div>
              {cycle.decision.comments && (
                <div className="mt-2 text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs">
                  {cycle.decision.comments}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn delay={0.1}>
          <DecisionForm
            cycleId={cycleId}
            avgRating={avg}
            suggestedHikePercent={suggestedSlab?.hikePercent ?? 0}
            grossAnnum={grossAnnum}
            reviewerRatings={reviewerRatings}
            selfAnswers={selfAnswers}
            mgmtCriteria={mgmtCriteria.map((c) => ({ name: c.name, maxPoints: c.maxPoints, items: c.items }))}
          />
        </FadeIn>
      )}
    </div>
  );
}
