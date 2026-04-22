import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntilAnniversary } from "@/lib/business-days";
import { toTitleCase } from "@/lib/utils";
import {
  computeCycleStatus,
  isReviewWindowOpen,
  isSelfAssessmentSubmitted,
  isSelfAssessmentWindowExpired,
} from "@/lib/workflow";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { Calendar, Star, TrendingUp, FileText, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING_SELF: "Self-assessment pending",
  SELF_SUBMITTED: "Self-assessment submitted",
  AWAITING_AVAILABILITY: "Reviewers confirming availability",
  RATING_IN_PROGRESS: "Rating in progress",
  RATINGS_COMPLETE: "Ratings complete",
  DATE_VOTING: "Scheduling meeting",
  SCHEDULED: "Meeting scheduled",
  DECIDED: "Decision finalized",
  CLOSED: "Closed",
};

export default async function EmployeeDashboard() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { salary: true },
  });
  if (!user) return null;

  const cycles = await prisma.appraisalCycle.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      self: true,
      assignments: { select: { availability: true } },
      ratings: { select: { role: true, averageScore: true, reviewerId: true } },
      decision: { include: { slab: true } },
      mom: true,
    },
  });

  const cycle = cycles[0] ?? null;
  const days = daysUntilAnniversary(user.joiningDate, new Date());
  const displayStatus = cycle
    ? computeCycleStatus({
        id: cycle.id,
        status: cycle.status,
        self: cycle.self,
        assignments: cycle.assignments,
        ratings: cycle.ratings,
      })
    : null;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome, {toTitleCase(user.name)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Joined {user.joiningDate.toLocaleDateString()} ·{" "}
            {days === 0
              ? "Anniversary today!"
              : `${days} day${days === 1 ? "" : "s"} to next anniversary`}
          </p>
        </div>
      </FadeIn>

      <StaggerList className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="size-4 text-blue-500" />
                <div className="text-xs text-slate-500">Joining Date</div>
              </div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {user.joiningDate.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="size-4 text-amber-500" />
                <div className="text-xs text-slate-500">Total Cycles</div>
              </div>
              <div className="font-semibold text-slate-900 dark:text-white">{cycles.length}</div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-green-500" />
                <div className="text-xs text-slate-500">Gross Salary</div>
              </div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {user.salary ? `₹${Number(user.salary.grossAnnum).toLocaleString()}/yr` : "—"}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerList>

      {days <= 7 && (
        <FadeIn delay={0.2}>
          <Card className="border-0 shadow-sm border-l-4 border-l-blue-400">
            <CardContent className="p-4 text-sm text-blue-700 dark:text-blue-300">
              Your appraisal cycle is approaching within a week of your anniversary.
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {cycle ? (
        <FadeIn delay={0.25}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Current Appraisal — {cycle.type}</span>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full px-2.5 py-0.5 font-normal">
                  {STATUS_LABELS[displayStatus ?? ""] ?? displayStatus}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {cycle.self &&
                !isSelfAssessmentSubmitted(cycle.self) &&
                !isSelfAssessmentWindowExpired(cycle.self) && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300">Self-assessment due</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Deadline: {cycle.self.editableUntil.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={`/employee/self/${cycle.id}`}
                      className="flex items-center gap-1 bg-amber-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-amber-600 transition-colors"
                    >
                      Start <ChevronRight className="size-3" />
                    </Link>
                  </div>
                )}

              {cycle.self && isSelfAssessmentSubmitted(cycle.self) && (
                <p className="text-slate-500 text-xs">
                  Self-assessment submitted — reviewers will proceed shortly.
                </p>
              )}

              {(displayStatus === "RATINGS_COMPLETE" ||
                displayStatus === "DATE_VOTING" ||
                displayStatus === "SCHEDULED" ||
                displayStatus === "DECIDED" ||
                displayStatus === "CLOSED") &&
                cycle.ratings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ratings</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Avg:{" "}
                        {(
                          cycle.ratings.reduce((s, r) => s + r.averageScore, 0) /
                          cycle.ratings.length
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {cycle.ratings.map((r) => (
                        <div
                          key={r.role}
                          className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"
                        >
                          <div className="text-xs text-slate-500">{r.role}</div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                            {r.averageScore.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {cycle.decision && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">
                    Final Decision
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Rating</div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cycle.decision.finalRating.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Slab</div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cycle.decision.slab?.label ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Increment</div>
                      <div className="font-bold text-green-600">
                        +₹{Number(cycle.decision.finalAmount).toLocaleString()}/yr
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cycle.mom && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <FileText className="size-3.5" />
                  MOM available for this appraisal
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn delay={0.25}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center text-slate-400">
              No active appraisal cycle. Admin will initiate one near your anniversary.
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
