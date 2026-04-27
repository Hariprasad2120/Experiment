import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { Users, Clock, AlertCircle, Calendar, ChevronRight, Bell, Zap } from "lucide-react";
import { getAppraisalEligibility, getMilestoneAlert, autoCycleType } from "@/lib/appraisal-eligibility";
import { ManagementCharts } from "../management/management-charts";

export default async function AdminDashboard() {
  const now = new Date();

  const [allEmployees, activeCycles, pendingAssignments, pendingExtensions, decidedCyclesRaw] = await Promise.all([
    prisma.user.findMany({
      where: { role: { notIn: ["MANAGEMENT", "PARTNER"] }, active: true },
      orderBy: { name: "asc" },
      include: {
        cyclesAsEmployee: {
          where: { status: { notIn: ["CLOSED", "DECIDED"] } },
          take: 1,
          select: { id: true, type: true, status: true },
        },
      },
    }),
    prisma.appraisalCycle.count({ where: { status: { notIn: ["CLOSED", "DECIDED"] } } }),
    prisma.cycleAssignment.count({ where: { availability: "PENDING" } }),
    prisma.extensionRequest.count({ where: { status: "PENDING" } }),
    prisma.appraisalCycle.findMany({
      where: { status: { in: ["DECIDED", "CLOSED"] } },
      include: { user: { select: { name: true } }, ratings: { select: { averageScore: true } }, decision: { include: { slab: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const chartData = [...decidedCyclesRaw].reverse()
    .filter((c) => c.ratings.length > 0)
    .map((c) => {
      const avg = c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length;
      return {
        name: toTitleCase(c.user.name).split(" ")[0],
        score: parseFloat(avg.toFixed(1)),
        hike: c.decision ? Number(c.decision.finalAmount) : 0,
      };
    });

  const allCyclesForStatus = await prisma.appraisalCycle.findMany({ select: { status: true } });
  const statusMap = new Map<string, number>();
  for (const c of allCyclesForStatus) {
    statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);
  }
  const statusCounts = [...statusMap.entries()]
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, count, label: status.replace(/_/g, " ") }));

  // Classify employees by what's due this month
  const dueForAppraisal: typeof allEmployees = [];
  const milestoneAlerts: { employee: typeof allEmployees[0]; alert: NonNullable<ReturnType<typeof getMilestoneAlert>> }[] = [];

  for (const emp of allEmployees) {
    const hasActive = emp.cyclesAsEmployee.length > 0;
    const eligibility = getAppraisalEligibility(emp.joiningDate, now);
    const alert = getMilestoneAlert(emp.joiningDate, now);

    if (eligibility.eligible && !hasActive) {
      dueForAppraisal.push(emp);
    }
    if (alert && alert.type === "EPF_ESI") {
      milestoneAlerts.push({ employee: emp, alert });
    }
  }

  const stats = [
    { label: "Due This Month", value: dueForAppraisal.length, icon: Calendar, color: "text-[#00cec4]", bg: "bg-[#008993]/10" },
    { label: "Active Cycles", value: activeCycles, icon: Clock, color: "text-[#ffaa2d]", bg: "bg-[#ffaa2d]/10" },
    { label: "Pending Availability", value: pendingAssignments, icon: Users, color: "text-[#008993]", bg: "bg-[#008993]/10" },
    { label: "Pending Extensions", value: pendingExtensions, icon: AlertCircle, color: "text-[#ff8333]", bg: "bg-[#ff8333]/10" },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-[#555] text-sm mt-1">
            {now.toLocaleString("default", { month: "long", year: "numeric" })}
          </p>
        </div>
      </FadeIn>

      <StaggerList className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className={`inline-flex rounded-lg p-2 ${s.bg} mb-3`}>
                  <s.icon className={`size-5 ${s.color}`} />
                </div>
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-[#555] mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Milestone alerts (EPF/ESI — no cycle needed, just email) */}
      {milestoneAlerts.length > 0 && (
        <FadeIn delay={0.15}>
          <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-[#ff8333]">
                <Bell className="size-4" /> Milestone Alerts ({milestoneAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {milestoneAlerts.map(({ employee, alert }) => (
                  <div key={employee.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-white">{toTitleCase(employee.name)}</span>
                      <span className="text-[#555] ml-2 text-xs">{alert.label}</span>
                    </div>
                    <span className="text-xs bg-[#ff8333]/15 text-[#ff8333] rounded-full px-2 py-0.5">
                      {alert.type === "EPF_ESI" ? "EPF/ESI Alert" : "Training"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Appraisals due this month */}
      <FadeIn delay={0.2}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appraisals Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {dueForAppraisal.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No appraisals due this month.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#555] border-b border-[#1a1a1a]">
                      <th className="py-2 font-medium">Emp #</th>
                      <th className="font-medium">Name</th>
                      <th className="font-medium">Department</th>
                      <th className="font-medium">Joining</th>
                      <th className="font-medium">Type</th>
                      <th className="font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {dueForAppraisal.map((u) => {
                      const cycleType = autoCycleType(u.joiningDate, now);
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 text-[#555]">{u.employeeNumber ?? "—"}</td>
                          <td className="font-medium text-white">{toTitleCase(u.name)}</td>
                          <td className="text-[#555]">{u.department ?? "—"}</td>
                          <td className="text-[#555]">{u.joiningDate.toLocaleDateString()}</td>
                          <td>
                            <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                              cycleType === "INTERIM"
                                ? "bg-[#ff8333]/15 text-[#ff8333]"
                                : "bg-[#008993]/15 text-[#00cec4]"
                            }`}>
                              {cycleType}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/admin/employees/${u.id}/assign`}
                              className="inline-flex items-center gap-1 text-[#008993] hover:text-[#00cec4] text-xs font-medium transition-colors duration-200"
                            >
                              Assign <ChevronRight className="size-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Performance overview charts */}
      {chartData.length > 0 && (
        <FadeIn delay={0.25}>
          <ManagementCharts chartData={chartData} statusCounts={statusCounts} />
        </FadeIn>
      )}

      <FadeIn delay={0.3}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: "/admin/employees", label: "Employees", desc: "Manage all users" },
            { href: "/admin/cycles", label: "All Cycles", desc: "View appraisal cycles" },
            { href: "/admin/slabs", label: "Increment Slabs", desc: "Configure hike bands" },
            { href: "/admin/extensions", label: "Extensions", desc: `${pendingExtensions} pending` },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-[#1a1a1a] hover:border-[#008993]/40 hover:shadow-[0_0_16px_rgba(0,137,147,0.15)] transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm text-white">{item.label}</div>
                  <div className="text-xs text-[#555] mt-0.5">{item.desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
