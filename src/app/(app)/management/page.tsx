import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import Link from "next/link";
import { BarChart3, ChevronRight, TrendingUp } from "lucide-react";
import type { CycleStatus } from "@/generated/prisma/enums";

const STATUS_BADGE: Record<string, string> = {
  RATINGS_COMPLETE: "bg-green-100 text-green-700",
  DATE_VOTING: "bg-purple-100 text-purple-700",
  SCHEDULED: "bg-teal-100 text-teal-700",
  DECIDED: "bg-emerald-100 text-emerald-700",
};

export default async function ManagementDashboard() {
  const cycles = await prisma.appraisalCycle.findMany({
    where: { status: { in: ["RATINGS_COMPLETE", "DATE_VOTING", "SCHEDULED", "DECIDED"] } },
    include: {
      user: { include: { salary: true } },
      ratings: true,
      decision: { include: { slab: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const slabs = await prisma.incrementSlab.findMany({ orderBy: { minRating: "desc" } });

  const totalDecided = cycles.filter((c) => c.status === "DECIDED").length;
  const totalPending = cycles.filter((c) => c.status === "RATINGS_COMPLETE").length;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Management Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Review final evaluations and salary impacts</p>
          </div>
          <Link
            href="/management/salary"
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="size-4" />
            Salary Calculator
          </Link>
        </div>
      </FadeIn>

      <StaggerList className="grid grid-cols-3 gap-4">
        <StaggerItem>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{cycles.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Total ready for review</div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-amber-600">{totalPending}</div>
              <div className="text-xs text-slate-500 mt-0.5">Awaiting decision</div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-green-600">{totalDecided}</div>
              <div className="text-xs text-slate-500 mt-0.5">Decided</div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerList>

      <FadeIn delay={0.2}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appraisal Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Employee</th>
                    <th className="px-4 font-medium">Type</th>
                    <th className="px-4 font-medium">Status</th>
                    <th className="px-4 font-medium">Avg Rating</th>
                    <th className="px-4 font-medium">Slab</th>
                    <th className="px-4 font-medium">Est. Hike</th>
                    <th className="px-4 font-medium">Current Gross</th>
                    <th className="px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cycles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No appraisals ready for management review yet.
                      </td>
                    </tr>
                  )}
                  {cycles.map((c) => {
                    const avg =
                      c.ratings.length > 0
                        ? c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length
                        : null;
                    const slab = avg !== null
                      ? slabs.find((s) => avg >= s.minRating && avg <= s.maxRating)
                      : null;
                    const grossAnnum = c.user.salary ? Number(c.user.salary.grossAnnum) : null;
                    const hikeAmt = slab && grossAnnum
                      ? Math.round((grossAnnum * slab.hikePercent) / 100)
                      : null;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {toTitleCase(c.user.name)}
                        </td>
                        <td className="px-4 text-slate-500 text-xs">{c.type}</td>
                        <td className="px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 font-semibold text-slate-700 dark:text-slate-200">
                          {avg?.toFixed(2) ?? "—"}
                        </td>
                        <td className="px-4">
                          {slab ? (
                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              {slab.label} ({slab.hikePercent}%)
                            </span>
                          ) : c.decision?.slab ? (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              {c.decision.slab.label}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4">
                          {hikeAmt !== null ? (
                            <span className="text-green-600 font-medium flex items-center gap-1 text-xs">
                              <TrendingUp className="size-3" />
                              +₹{hikeAmt.toLocaleString()}
                            </span>
                          ) : c.decision ? (
                            <span className="text-green-600 font-medium text-xs">
                              ₹{Number(c.decision.finalAmount).toLocaleString()}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 text-slate-500 text-xs">
                          {grossAnnum ? `₹${grossAnnum.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4">
                          <Link
                            href={`/management/decide/${c.id}`}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
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
    </div>
  );
}
