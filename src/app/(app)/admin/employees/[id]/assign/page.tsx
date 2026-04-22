import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignForm } from "./assign-form";
import { DemoControls } from "./demo-controls";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import { getAppraisalEligibility, autoCycleType } from "@/lib/appraisal-eligibility";
import { canBeAppraised } from "@/lib/rbac";
import { Calendar, User } from "lucide-react";

export default async function AssignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.user.findUnique({ where: { id } });
  if (!employee || !canBeAppraised(employee.role)) notFound();

  const [hrUsers, tlUsers, mgrUsers] = await Promise.all([
    prisma.user.findMany({ where: { role: "HR", active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "TL", active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "MANAGER", active: true }, orderBy: { name: "asc" } }),
  ]);

  const existingCycle = await prisma.appraisalCycle.findFirst({
    where: { userId: id, status: { notIn: ["CLOSED", "DECIDED"] } },
    include: { assignments: true, self: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const eligibility = getAppraisalEligibility(employee.joiningDate, now);
  const autoType = autoCycleType(employee.joiningDate, now);

  // Months of tenure for display
  const monthsTenure =
    (now.getFullYear() - employee.joiningDate.getFullYear()) * 12 +
    (now.getMonth() - employee.joiningDate.getMonth());

  return (
    <div className="space-y-5 max-w-3xl">
      <FadeIn>
        <div>
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

      <FadeIn delay={0.1}>
        <AssignForm
          employeeId={employee.id}
          employeeName={toTitleCase(employee.name)}
          existingCycleId={existingCycle?.id ?? null}
          existingCycleType={existingCycle?.type ?? null}
          existingAssignments={
            existingCycle?.assignments.map((a) => ({ role: a.role, reviewerId: a.reviewerId })) ?? []
          }
          autoType={autoType}
          autoReason={eligibility.eligible ? eligibility.reason : `Tenure: ${monthsTenure} months`}
          eligible={eligibility.eligible}
          hrUsers={hrUsers.map((u) => ({ id: u.id, name: toTitleCase(u.name) }))}
          tlUsers={tlUsers.map((u) => ({ id: u.id, name: toTitleCase(u.name) }))}
          mgrUsers={mgrUsers.map((u) => ({ id: u.id, name: toTitleCase(u.name) }))}
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
