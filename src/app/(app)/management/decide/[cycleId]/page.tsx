import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { DecisionForm } from "./decision-form";
import { CheckCircle } from "lucide-react";

export default async function DecidePage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      user: { include: { salary: true } },
      ratings: { include: { reviewer: { select: { name: true, role: true } } } },
      decision: { include: { slab: true } },
      assignments: { include: { reviewer: { select: { name: true } } } },
    },
  });
  if (!cycle) notFound();

  const slabs = await prisma.incrementSlab.findMany({ orderBy: { minRating: "desc" } });

  const avg = cycle.ratings.length > 0
    ? cycle.ratings.reduce((s, r) => s + r.averageScore, 0) / cycle.ratings.length
    : 0;

  const suggestedSlab = slabs.find((s) => avg >= s.minRating && avg <= s.maxRating);
  const grossAnnum = cycle.user.salary ? Number(cycle.user.salary.grossAnnum) : 0;
  const suggestedAmount = suggestedSlab ? Math.round(grossAnnum * suggestedSlab.hikePercent / 100) : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Finalize: {toTitleCase(cycle.user.name)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {cycle.type} Appraisal · {cycle.user.department ?? "—"}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cycle.ratings.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500">{r.role}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {r.averageScore.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400">{toTitleCase(r.reviewer.name)}</div>
                {r.postComment && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded p-1.5">
                    Note: {r.postComment}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Card className="border-0 shadow-sm border-l-4 border-l-blue-400">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Average</div>
              <div className="text-xl font-bold text-blue-600 mt-1">{avg.toFixed(2)}</div>
              <div className="text-xs text-slate-400">
                {suggestedSlab?.label ?? "No slab match"}
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {cycle.decision ? (
        <FadeIn delay={0.2}>
          <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle className="size-4" /> Appraisal Decided
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-slate-500">Final Rating</div>
                <div className="font-semibold">{cycle.decision.finalRating.toFixed(2)}</div>
                <div className="text-slate-500">Slab</div>
                <div className="font-semibold">{cycle.decision.slab?.label ?? "—"}</div>
                <div className="text-slate-500">Final Increment</div>
                <div className="font-semibold text-green-600">₹{Number(cycle.decision.finalAmount).toLocaleString()}/yr</div>
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
        <FadeIn delay={0.2}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Make Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionForm
                cycleId={cycleId}
                avgRating={avg}
                slabs={slabs}
                suggestedSlabId={suggestedSlab?.id ?? null}
                suggestedAmount={suggestedAmount}
                grossAnnum={grossAnnum}
              />
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
