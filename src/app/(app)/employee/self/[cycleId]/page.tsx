import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelfForm } from "./self-form";
import { SUPPLEMENTARY_SECTIONS } from "@/lib/criteria";
import { getMergedCriteria } from "@/lib/criteria-overrides";
import { FadeIn } from "@/components/motion-div";
import { allReviewersAvailable } from "@/lib/workflow";
import { Users } from "lucide-react";

export default async function SelfPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: { self: true, user: true, assignments: { select: { availability: true, role: true } } },
  });
  if (!cycle || cycle.userId !== session.user.id) notFound();
  if (!cycle.self) notFound();

  const allAvailable = allReviewersAvailable(cycle.assignments);
  const locked = !allAvailable || cycle.self.locked || new Date() > cycle.self.editableUntil;
  const existing = (cycle.self.answers as Record<string, { score: number; comment: string }>) ?? {};
  const mergedCategories = await getMergedCriteria();

  return (
    <div className="max-w-3xl space-y-5">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self-Assessment</h1>
          <p className="text-slate-500 text-sm mt-1">{cycle.type} cycle</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Editable until{" "}
              <span className="text-slate-900 dark:text-white">
                {cycle.self.editableUntil.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </FadeIn>

      {!allAvailable && (
        <FadeIn delay={0.08}>
          <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
            <CardContent className="p-4 flex items-start gap-3">
              <Users className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-300">Waiting for reviewers</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Self-assessment opens once all assigned reviewers confirm availability.
                </p>
                <div className="mt-2 space-y-1">
                  {cycle.assignments.map((a) => (
                    <div key={a.role} className="flex items-center gap-2 text-xs">
                      <span className={`size-1.5 rounded-full ${a.availability === "AVAILABLE" ? "bg-green-500" : "bg-amber-400"}`} />
                      <span className="text-slate-600 dark:text-slate-400">{a.role}</span>
                      <span className={a.availability === "AVAILABLE" ? "text-green-600 font-medium" : "text-amber-600"}>
                        {a.availability === "AVAILABLE" ? "Available" : a.availability === "NOT_AVAILABLE" ? "Not available" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {locked && allAvailable && (
        <FadeIn delay={0.1}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center text-slate-400">
              This self-assessment is locked and can no longer be edited.
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {!locked && (
        <FadeIn delay={0.1}>
          <SelfForm
            cycleId={cycleId}
            categories={mergedCategories}
            supplementary={SUPPLEMENTARY_SECTIONS}
            existing={existing}
            editableUntil={cycle.self.editableUntil.toISOString()}
            submittedAt={cycle.self.submittedAt?.toISOString() ?? null}
            editCount={cycle.self.editCount}
          />
        </FadeIn>
      )}
    </div>
  );
}
