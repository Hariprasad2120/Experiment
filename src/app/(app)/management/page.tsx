import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  IndianRupee,
  Activity,
} from "lucide-react";
import type { CycleStatus } from "@/generated/prisma/enums";
import { ManagementCharts } from "./management-charts";

const STATUS_BADGE: Record<string, string> = {
  RATINGS_COMPLETE: "bg-green-100 text-green-700",
  DATE_VOTING: "bg-purple-100 text-purple-700",
  SCHEDULED: "bg-teal-100 text-teal-700",
  DECIDED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

const ALL_STATUSES: CycleStatus[] = [
  "PENDING_SELF",
  "SELF_SUBMITTED",
  "AWAITING_AVAILABILITY",
  "RATING_IN_PROGRESS",
  "RATINGS_COMPLETE",
  "DATE_VOTING",
  "SCHEDULED",
  "DECIDED",
  "CLOSED",
];

export default async function ManagementDashboard() {
  const [cycles, slabs, allEmployees] = await Promise.all([
    prisma.appraisalCycle.findMany({
      include: {
        user: { include: { salary: true, salaryRevisions: { orderBy: { effectiveFrom: "desc" }, take: 3 } } },
        ratings: true,
        decision: { include: { slab: true } },
        assignments: { select: { reviewer: { select: { name: true } }, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.incrementSlab.findMany({ orderBy: { minRating: "desc" } }),
    prisma.user.findMany({
      where: { active: true, role: { notIn: ["MANAGEMENT", "PARTNER", "ADMIN"] } },
      include: { salary: true, cyclesAsEmployee: { include: { ratings: true, decision: { include: { slab: true } } } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const actionableCycles = cycles.filter((c) =>
    ["RATINGS_COMPLETE", "DATE_VOTING", "SCHEDULED", "DECIDED"].includes(c.status),
  );
  const totalDecided = cycles.filter((c) => c.status === "DECIDED").length;
  const totalPending = cycles.filter((c) => c.status === "RATINGS_COMPLETE").length;
  const totalClosed = cycles.filter((c) => c.status === "CLOSED").length;

  // Build chart data: avg rating per cycle over time (last 20 decided)
  const decidedCycles = cycles
    .filter((c) => c.status === "DECIDED" && c.ratings.length > 0)
    .slice(0, 20)
    .reverse();

  const chartData = decidedCycles.map((c) => {
    const avg = c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length;
    return {
      name: toTitleCase(c.user.name).split(" ")[0],
      score: parseFloat(avg.toFixed(1)),
      hike: c.decision ? Number(c.decision.finalAmount) : 0,
    };
  });

  // Status distribution for pie-like data
  const statusCounts = ALL_STATUSES.map((s) => ({
    status: s,
    count: cycles.filter((c) => c.status === s).length,
    label: s.replace(/_/g, " "),
  })).filter((x) => x.count > 0);

  // Top performers (by avg rating in decided cycles)
  const employeePerf = allEmployees.map((emp) => {
    const decidedEmpCycles = emp.cyclesAsEmployee.filter(
      (c) => c.status === "DECIDED" && c.ratings.length > 0,
    );
    const avgRating =
      decidedEmpCycles.length > 0
        ? decidedEmpCycles.reduce((s, c) => {
            const cycleAvg = c.ratings.reduce((rs, r) => rs + r.averageScore, 0) / c.ratings.length;
            return s + cycleAvg;
          }, 0) / decidedEmpCycles.length
        : null;
    const lastHike = decidedEmpCycles[0]?.decision?.finalAmount ?? null;
    const lastSlab = decidedEmpCycles[0]?.decision?.slab ?? null;
    return {
      id: emp.id,
      name: emp.name,
      grossAnnum: emp.salary ? Number(emp.salary.grossAnnum) : null,
      avgRating,
      cycleCount: emp.cyclesAsEmployee.length,
      lastHike: lastHike ? Number(lastHike) : null,
      lastSlab,
    };
  }).filter((e) => e.avgRating !== null)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, 10);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Management Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Appraisal overview, employee performance & salary impact</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/management/salary"
              className="flex items-center gap-2 bg-[#008993] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#007880] transition-colors"
            >
              <BarChart3 className="size-4" />
              Salary Calculator
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 border border-[#1a1a1a] text-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:border-[#008993] hover:text-[#00cec4] transition-colors"
            >
              <Activity className="size-4" />
              Full History
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* KPI cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Cycles", value: cycles.length, icon: <Users className="size-5 text-[#008993]" />, color: "text-white" },
          { label: "Awaiting Decision", value: totalPending, icon: <Clock className="size-5 text-amber-400" />, color: "text-amber-400" },
          { label: "Decided", value: totalDecided, icon: <CheckCircle2 className="size-5 text-green-400" />, color: "text-green-400" },
          { label: "Closed", value: totalClosed, icon: <IndianRupee className="size-5 text-slate-400" />, color: "text-slate-300" },
        ].map((kpi) => (
          <StaggerItem key={kpi.label}>
            <Card className="border border-[#1a1a1a] bg-[#111] shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  {kpi.icon}
                </div>
                <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Charts row */}
      <FadeIn delay={0.15}>
        <ManagementCharts chartData={chartData} statusCounts={statusCounts} />
      </FadeIn>

      {/* Top performers */}
      {employeePerf.length > 0 && (
        <FadeIn delay={0.2}>
          <Card className="border border-[#1a1a1a] bg-[#111] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <TrendingUp className="size-4 text-[#008993]" />
                Top Performers (by avg appraisal rating)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                      <th className="py-3 px-4 font-medium">#</th>
                      <th className="px-4 font-medium">Employee</th>
                      <th className="px-4 font-medium">Avg Rating</th>
                      <th className="px-4 font-medium">Cycles</th>
                      <th className="px-4 font-medium">Last Slab</th>
                      <th className="px-4 font-medium">Last Hike</th>
                      <th className="px-4 font-medium">Current Gross</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {employeePerf.map((e, i) => (
                      <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 text-slate-500 text-xs">{i + 1}</td>
                        <td className="px-4 font-medium text-slate-200">
                          <Link href={`/admin/employees/${e.id}`} className="hover:text-[#00cec4] transition-colors">
                            {toTitleCase(e.name)}
                          </Link>
                        </td>
                        <td className="px-4">
                          <span className="font-bold text-[#00cec4]">{e.avgRating!.toFixed(2)}</span>
                        </td>
                        <td className="px-4 text-slate-400">{e.cycleCount}</td>
                        <td className="px-4">
                          {e.lastSlab ? (
                            <span className="text-xs text-purple-400">{e.lastSlab.label}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 text-green-400 font-medium text-xs">
                          {e.lastHike ? `+${fmt(e.lastHike)}` : "—"}
                        </td>
                        <td className="px-4 text-slate-400 text-xs">
                          {e.grossAnnum ? fmt(e.grossAnnum) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Actionable appraisals */}
      <FadeIn delay={0.25}>
        <Card className="border border-[#1a1a1a] bg-[#111] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-300">Appraisal Results — Action Required</CardTitle>
              <Link href="/history" className="text-xs text-[#008993] hover:text-[#00cec4] transition-colors">
                Full history →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                    <th className="py-3 px-4 font-medium">Employee</th>
                    <th className="px-4 font-medium">Type</th>
                    <th className="px-4 font-medium">Status</th>
                    <th className="px-4 font-medium">Avg Rating</th>
                    <th className="px-4 font-medium">Slab</th>
                    <th className="px-4 font-medium">Est. Hike</th>
                    <th className="px-4 font-medium">Current Gross</th>
                    <th className="px-4 font-medium">Reviewers</th>
                    <th className="px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {actionableCycles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No appraisals ready for management review.
                      </td>
                    </tr>
                  )}
                  {actionableCycles.map((c) => {
                    const avg =
                      c.ratings.length > 0
                        ? c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length
                        : null;
                    const slab =
                      avg !== null
                        ? slabs.find((s) => avg >= s.minRating && avg <= s.maxRating)
                        : null;
                    const grossAnnum = c.user.salary ? Number(c.user.salary.grossAnnum) : null;
                    const hikeAmt =
                      slab && grossAnnum
                        ? Math.round((grossAnnum * slab.hikePercent) / 100)
                        : null;
                    const reviewerNames = c.assignments.map((a) => a.reviewer.name.split(" ")[0]).join(", ");

                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-200">
                          <Link href={`/admin/employees/${c.userId}`} className="hover:text-[#00cec4] transition-colors">
                            {toTitleCase(c.user.name)}
                          </Link>
                        </td>
                        <td className="px-4 text-slate-500 text-xs">{c.type}</td>
                        <td className="px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] ?? "bg-slate-800 text-slate-400"}`}>
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 font-semibold text-[#00cec4]">
                          {avg?.toFixed(2) ?? "—"}
                        </td>
                        <td className="px-4">
                          {slab ? (
                            <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">
                              {slab.label} ({slab.hikePercent}%)
                            </span>
                          ) : c.decision?.slab ? (
                            <span className="text-xs bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full">
                              {c.decision.slab.label}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4">
                          {hikeAmt !== null ? (
                            <span className="text-green-400 font-medium flex items-center gap-1 text-xs">
                              <TrendingUp className="size-3" />
                              +{fmt(hikeAmt)}
                            </span>
                          ) : c.decision ? (
                            <span className="text-green-400 font-medium text-xs">
                              {fmt(Number(c.decision.finalAmount))}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 text-slate-400 text-xs">
                          {grossAnnum ? fmt(grossAnnum) : "—"}
                        </td>
                        <td className="px-4 text-slate-500 text-xs">{reviewerNames || "—"}</td>
                        <td className="px-4">
                          <Link
                            href={`/management/decide/${c.id}`}
                            className="text-xs text-[#008993] hover:text-[#00cec4] font-medium flex items-center gap-1 transition-colors"
                          >
                            Decide <ChevronRight className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* All employees salary overview */}
      <FadeIn delay={0.3}>
        <Card className="border border-[#1a1a1a] bg-[#111] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <IndianRupee className="size-4 text-[#ff8333]" />
              Employee Salary Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[#1a1a1a] bg-[#0d0d0d]">
                    <th className="py-3 px-4 font-medium">Employee</th>
                    <th className="px-4 font-medium">Gross / yr</th>
                    <th className="px-4 font-medium">CTC / yr</th>
                    <th className="px-4 font-medium">Basic / mo</th>
                    <th className="px-4 font-medium">Appraisal Cycles</th>
                    <th className="px-4 font-medium">Last Rating</th>
                    <th className="px-4 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {allEmployees.slice(0, 30).map((emp) => {
                    const decidedEmpCycles = emp.cyclesAsEmployee.filter(
                      (c) => c.status === "DECIDED" && c.ratings.length > 0,
                    );
                    const lastAvg = decidedEmpCycles[0]
                      ? decidedEmpCycles[0].ratings.reduce((s, r) => s + r.averageScore, 0) / decidedEmpCycles[0].ratings.length
                      : null;
                    return (
                      <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-medium text-slate-200">
                          <Link href={`/admin/employees/${emp.id}`} className="hover:text-[#00cec4] transition-colors">
                            {toTitleCase(emp.name)}
                          </Link>
                        </td>
                        <td className="px-4 text-slate-300 font-semibold text-xs">
                          {emp.salary ? fmt(Number(emp.salary.grossAnnum)) : "—"}
                        </td>
                        <td className="px-4 text-slate-400 text-xs">
                          {emp.salary ? fmt(Number(emp.salary.ctcAnnum)) : "—"}
                        </td>
                        <td className="px-4 text-slate-400 text-xs">
                          {emp.salary ? fmt(Number(emp.salary.basic)) : "—"}
                        </td>
                        <td className="px-4 text-slate-500 text-xs">
                          {emp.cyclesAsEmployee.length}
                        </td>
                        <td className="px-4">
                          {lastAvg !== null ? (
                            <span className="font-semibold text-[#00cec4] text-xs">
                              {lastAvg.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4">
                          <Link
                            href={`/admin/employees/${emp.id}`}
                            className="text-xs text-slate-500 hover:text-[#008993] transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {allEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-600">No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
