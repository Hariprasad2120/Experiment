import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { Users, Clock, AlertCircle, Calendar, ChevronRight, Bell } from "lucide-react";
import { getAppraisalEligibility, getMilestoneAlert, autoCycleType } from "@/lib/appraisal-eligibility";
import { ManagementCharts } from "../management/management-charts";

export default async function AdminDashboard() {
  const now = new Date();

  const [allEmployees, activeCycles, pendingAssignments, pendingExtensions, decidedCyclesRaw] =
    await Promise.all([
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
        include: {
          user: { select: { name: true } },
          ratings: { select: { averageScore: true } },
          decision: { include: { slab: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  const chartData = [...decidedCyclesRaw]
    .reverse()
    .filter((c) => c.ratings.length > 0)
    .map((c) => {
      const avg = c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length;
      return {
        name: toTitleCase(c.user.name).split(" ")[0],
        score: parseFloat(avg.toFixed(1)),
        hike: c.decision ? Number(c.decision.finalAmount) : 0,
      };
    });

  const allCyclesForStatus = await prisma.appraisalCycle.findMany({
    select: { status: true },
  });
  const statusMap = new Map<string, number>();
  for (const c of allCyclesForStatus) {
    statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);
  }
  const statusCounts = [...statusMap.entries()]
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, count, label: status.replace(/_/g, " ") }));

  const dueForAppraisal: typeof allEmployees = [];
  const milestoneAlerts: {
    employee: (typeof allEmployees)[0];
    alert: NonNullable<ReturnType<typeof getMilestoneAlert>>;
  }[] = [];

  for (const emp of allEmployees) {
    const hasActive = emp.cyclesAsEmployee.length > 0;
    const eligibility = getAppraisalEligibility(emp.joiningDate, now);
    const alert = getMilestoneAlert(emp.joiningDate, now);
    if (eligibility.eligible && !hasActive) dueForAppraisal.push(emp);
    if (alert && alert.type === "EPF_ESI") milestoneAlerts.push({ employee: emp, alert });
  }

  const stats = [
    {
      label: "Due This Month",
      value: dueForAppraisal.length,
      icon: Calendar,
      accent: "stat-cyan",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-50 dark:bg-cyan-900/20",
    },
    {
      label: "Active Cycles",
      value: activeCycles,
      icon: Clock,
      accent: "stat-amber",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Pending Availability",
      value: pendingAssignments,
      icon: Users,
      accent: "stat-teal",
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      label: "Pending Extensions",
      value: pendingExtensions,
      icon: AlertCircle,
      accent: "stat-orange",
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {now.toLocaleString("default", { month: "long", year: "numeric" })}
          </p>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerList className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Card className={`border border-border shadow-sm ${s.accent} bg-card`}>
              <CardContent className="p-5">
                <div className={`inline-flex rounded-xl p-2.5 ${s.iconBg} mb-3`}>
                  <s.icon className={`size-5 ${s.iconColor}`} />
                </div>
                <div className="text-3xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Milestone alerts */}
      {milestoneAlerts.length > 0 && (
        <FadeIn delay={0.15}>
          <Card className="border border-orange-200 dark:border-orange-900/50 shadow-sm bg-orange-50/50 dark:bg-orange-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Bell className="size-4" /> Milestone Alerts ({milestoneAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {milestoneAlerts.map(({ employee, alert }) => (
                  <div key={employee.id} className="flex items-center justify-between text-sm flex-wrap gap-2">
                    <div>
                      <span className="font-medium text-foreground">{toTitleCase(employee.name)}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{alert.label}</span>
                    </div>
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full px-2.5 py-0.5 font-medium">
                      {alert.type === "EPF_ESI" ? "EPF/ESI Alert" : "Training"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Appraisals due */}
      <FadeIn delay={0.2}>
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Appraisals Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {dueForAppraisal.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No appraisals due this month.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2.5 px-2 font-medium">Emp #</th>
                      <th className="px-2 font-medium">Name</th>
                      <th className="px-2 font-medium hidden sm:table-cell">Department</th>
                      <th className="px-2 font-medium hidden sm:table-cell">Joining</th>
                      <th className="px-2 font-medium">Type</th>
                      <th className="px-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dueForAppraisal.map((u) => {
                      const cycleType = autoCycleType(u.joiningDate, now);
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-2 text-muted-foreground text-xs">
                            {u.employeeNumber ?? "—"}
                          </td>
                          <td className="px-2 font-medium text-foreground">
                            {toTitleCase(u.name)}
                          </td>
                          <td className="px-2 text-muted-foreground text-xs hidden sm:table-cell">
                            {u.department ?? "—"}
                          </td>
                          <td className="px-2 text-muted-foreground text-xs hidden sm:table-cell">
                            {u.joiningDate.toLocaleDateString()}
                          </td>
                          <td className="px-2">
                            <span
                              className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                                cycleType === "INTERIM"
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                  : "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                              }`}
                            >
                              {cycleType}
                            </span>
                          </td>
                          <td className="px-2">
                            <Link
                              href={`/admin/employees/${u.id}/assign`}
                              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
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

      {/* Charts */}
      {chartData.length > 0 && (
        <FadeIn delay={0.25}>
          <ManagementCharts chartData={chartData} statusCounts={statusCounts} />
        </FadeIn>
      )}

      {/* Quick links */}
      <FadeIn delay={0.3}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/admin/employees", label: "Employees", desc: "Manage all users" },
            { href: "/admin/cycles", label: "All Cycles", desc: "View appraisal cycles" },
            { href: "/admin/slabs", label: "Increment Slabs", desc: "Configure hike bands" },
            {
              href: "/admin/extensions",
              label: "Extensions",
              desc: `${pendingExtensions} pending`,
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block group">
              <Card className="border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer h-full bg-card">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
