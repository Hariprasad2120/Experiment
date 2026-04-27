import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignForm } from "./assign-form";
import { DemoControls } from "./demo-controls";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import { getAppraisalEligibility, autoCycleType } from "@/lib/appraisal-eligibility";
import { canBeAppraised } from "@/lib/rbac";
import { Calendar, User, IndianRupee, TrendingUp, ExternalLink, CheckCircle, Circle, Clock } from "lucide-react";
import Link from "next/link";

export default async function AssignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.user.findUnique({
    where: { id },
    include: { salary: true },
  });
  if (!employee || !canBeAppraised(employee.role)) notFound();

  const [hrUsers, tlUsers, mgrUsers] = await Promise.all([
    prisma.user.findMany({ where: { role: "HR", active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "TL", active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "MANAGER", active: true }, orderBy: { name: "asc" } }),
  ]);

  const existingCycle = await prisma.appraisalCycle.findFirst({
    where: { userId: id, status: { notIn: ["CLOSED", "DECIDED"] } },
    include: {
      assignments: {
        include: { reviewer: { select: { id: true, name: true, role: true } } },
      },
      self: true,
      ratings: { select: { role: true, reviewerId: true, submittedAt: true, averageScore: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const eligibility = getAppraisalEligibility(employee.joiningDate, now);
  const autoType = autoCycleType(employee.joiningDate, now);

  const monthsTenure =
    (now.getFullYear() - employee.joiningDate.getFullYear()) * 12 +
    (now.getMonth() - employee.joiningDate.getMonth());

  const grossAnnum = employee.salary ? Number(employee.salary.grossAnnum) : null;

  const revisions = await prisma.salaryRevision.findMany({
    where: { userId: id },
    orderBy: { effectiveFrom: "desc" },
    take: 5,
  });

  const selfSubmitted = !!existingCycle?.self?.submittedAt;
  const selfDeadlinePassed = existingCycle?.self
    ? new Date() > existingCycle.self.editableUntil
    : false;

  return (
    <div className="space-y-5 max-w-3xl">
      <FadeIn>
        <div className="flex items-center gap-3">
          <Link href="/admin/appraisals" className="text-xs text-slate-400 hover:text-slate-600">
            ← Back to Appraisals
          </Link>
        </div>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {toTitleCase(employee.name)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{employee.department ?? "—"} · {employee.designation ?? "—"}</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
                <User className="size-3" /> Emp #
              </div>
              <div className="font-medium">{employee.employeeNumber ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
                <Calendar className="size-3" /> Joining Date
              </div>
              <div className="font-medium">{employee.joiningDate.toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Tenure</div>
              <div className="font-medium">
                {monthsTenure >= 12
                  ? `${Math.floor(monthsTenure / 12)}y ${monthsTenure % 12}m`
                  : `${monthsTenure} month${monthsTenure !== 1 ? "s" : ""}`}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Type</div>
              <div className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                monthsTenure < 12
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {monthsTenure < 12 ? "Fresher" : "Experienced"}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Active cycle status panel */}
      {existingCycle && existingCycle.assignments.length > 0 && (
        <FadeIn delay={0.07}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Cycle Status
                <span className="ml-auto text-xs font-normal text-slate-500">
                  {existingCycle.type} · {existingCycle.status.replace(/_/g, " ")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Self-assessment status */}
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Self-Assessment</div>
                <div className="flex items-center gap-2 text-sm">
                  {selfSubmitted ? (
                    <CheckCircle className="size-4 text-green-500 shrink-0" />
                  ) : selfDeadlinePassed ? (
                    <Circle className="size-4 text-red-400 shrink-0" />
                  ) : (
                    <Clock className="size-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300 flex-1">
                    {toTitleCase(employee.name)}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    selfSubmitted
                      ? "bg-green-100 text-green-700"
                      : selfDeadlinePassed
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {selfSubmitted ? "Submitted" : selfDeadlinePassed ? "Deadline passed" : `Due ${existingCycle.self?.editableUntil.toLocaleDateString()}`}
                  </span>
                </div>
              </div>

              {/* Reviewer availability + rating status */}
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Reviewers</div>
                <div className="space-y-2">
                  {existingCycle.assignments.map((a) => {
                    const rating = existingCycle.ratings.find((r) => r.reviewerId === a.reviewer.id);
                    return (
                      <div key={a.id} className="flex items-center gap-2.5">
                        {/* Availability indicator */}
                        <div className="flex items-center gap-1.5 w-28 shrink-0">
                          {a.availability === "AVAILABLE" ? (
                            <CheckCircle className="size-3.5 text-green-500" />
                          ) : a.availability === "NOT_AVAILABLE" ? (
                            <Circle className="size-3.5 text-red-400" />
                          ) : (
                            <Clock className="size-3.5 text-amber-400" />
                          )}
                          <span className="text-xs text-slate-600 dark:text-slate-400">{a.role}</span>
                        </div>

                        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate">
                          {toTitleCase(a.reviewer.name)}
                        </span>

                        {/* Availability badge */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          a.availability === "AVAILABLE"
                            ? "bg-green-100 text-green-700"
                            : a.availability === "NOT_AVAILABLE"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {a.availability === "AVAILABLE" ? "Available" : a.availability === "NOT_AVAILABLE" ? "Not Available" : "Pending"}
                        </span>

                        {/* Rating badge */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          rating
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {rating ? `Rated ${rating.averageScore.toFixed(1)}` : "Not Rated"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Salary & Revision History */}
      <FadeIn delay={0.08}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="size-4" /> Salary & Revision History
              </CardTitle>
              <Link
                href={`/admin/salary-revisions?emp=${employee.employeeNumber ?? ""}`}
                className="flex items-center gap-1 text-xs text-[#008993] hover:text-[#00cec4] transition-colors"
              >
                View all <ExternalLink className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {grossAnnum ? (
              <div className="flex flex-wrap gap-6 text-sm mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Current Gross (Annual)</div>
                  <div className="font-semibold text-slate-900 dark:text-white">₹{grossAnnum.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Current Gross (Monthly)</div>
                  <div className="font-semibold text-slate-900 dark:text-white">₹{Math.round(grossAnnum / 12).toLocaleString()}</div>
                </div>
                {employee.salary && (
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">CTC (Annual)</div>
                    <div className="font-semibold text-slate-900 dark:text-white">₹{Number(employee.salary.ctcAnnum).toLocaleString()}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                No salary record.{" "}
                <a href={`/admin/employees/${employee.id}/edit?tab=salary`} className="text-[#008993] underline">
                  Add salary
                </a>
              </p>
            )}

            {revisions.length > 0 ? (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <TrendingUp className="size-3" /> Recent Revisions
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-1.5 pr-3 font-medium">Effective</th>
                        <th className="py-1.5 pr-3 font-medium">Gross</th>
                        <th className="py-1.5 pr-3 font-medium">CTC</th>
                        <th className="py-1.5 pr-3 font-medium">Revised CTC</th>
                        <th className="py-1.5 pr-3 font-medium">Rev %</th>
                        <th className="py-1.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {revisions.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400">
                            {r.effectiveFrom.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </td>
                          <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">₹{Number(r.grossAnnum).toLocaleString()}</td>
                          <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">₹{Number(r.ctcAnnum).toLocaleString()}</td>
                          <td className="py-1.5 pr-3 font-medium text-slate-900 dark:text-white">₹{Number(r.revisedCtc).toLocaleString()}</td>
                          <td className="py-1.5 pr-3">
                            {r.revisionPercentage ? (
                              <span className="text-green-600 font-medium">{Number(r.revisionPercentage)}%</span>
                            ) : "—"}
                          </td>
                          <td className="py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              r.status === "Approved" ? "bg-green-100 text-green-700" :
                              r.status === "Pending"  ? "bg-amber-100 text-amber-700" :
                                                        "bg-red-100 text-red-700"
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <TrendingUp className="size-3" /> No revision history found.
              </p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <AssignForm
          employeeId={employee.id}
          employeeName={toTitleCase(employee.name)}
          existingCycleId={existingCycle?.id ?? null}
          existingCycleType={existingCycle?.type ?? null}
          existingCycleIsManagerCycle={existingCycle?.isManagerCycle ?? false}
          existingAssignments={
            existingCycle?.assignments.map((a) => ({ role: a.role, reviewerId: a.reviewerId })) ?? []
          }
          autoType={autoType}
          autoReason={eligibility.eligible ? eligibility.reason : `Tenure: ${monthsTenure} months`}
          eligible={eligibility.eligible}
          hrUsers={hrUsers.map((u) => ({ id: u.id, name: toTitleCase(u.name) }))}
          tlUsers={tlUsers.map((u) => ({ id: u.id, name: toTitleCase(u.name) }))}
          mgrUsers={mgrUsers.map((u) => ({ id: u.id, name: toTitleCase(u.name) }))}
          appraiseeId={employee.id}
          employeeRole={employee.role}
        />
      </FadeIn>

      {existingCycle?.self && (
        <FadeIn delay={0.2}>
          <DemoControls
            cycleId={existingCycle.id}
            editableUntil={existingCycle.self.editableUntil.toISOString()}
            submittedAt={existingCycle.self.submittedAt?.toISOString() ?? null}
          />
        </FadeIn>
      )}
    </div>
  );
}
