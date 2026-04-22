import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  DECIDED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-500",
  RATINGS_COMPLETE: "bg-green-100 text-green-700",
  SCHEDULED: "bg-teal-100 text-teal-700",
  PENDING_SELF: "bg-slate-100 text-slate-600",
  SELF_SUBMITTED: "bg-blue-100 text-blue-700",
  RATING_IN_PROGRESS: "bg-orange-100 text-orange-700",
  AWAITING_AVAILABILITY: "bg-yellow-100 text-yellow-700",
  DATE_VOTING: "bg-purple-100 text-purple-700",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; q?: string; empId?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role;
  const where: Record<string, unknown> = {};
  if (role === "MANAGEMENT" || role === "PARTNER") {
    // no personal cycles
  } else if (role === "ADMIN") {
    // admin sees all — no filter
  } else if (["HR", "TL", "MANAGER"].includes(role)) {
    // reviewer + own appraisee cycles
    where.OR = [
      { userId: session.user.id },
      { assignments: { some: { reviewerId: session.user.id } } },
    ];
  } else {
    // EMPLOYEE
    where.userId = session.user.id;
  }

  if (sp.q) {
    where.user = {
      OR: [
        { name: { contains: sp.q, mode: "insensitive" } },
        { employeeNumber: { equals: Number(sp.q) || undefined } },
      ],
    };
  }

  const cycles = await prisma.appraisalCycle.findMany({
    where,
    include: {
      user: { select: { name: true, employeeNumber: true, department: true } },
      decision: { include: { slab: true } },
      ratings: { select: { averageScore: true } },
    },
    orderBy: { startDate: "desc" },
    take: 100,
  });

  const filtered = cycles.filter((c) => {
    if (sp.month && c.startDate.getMonth() !== Number(sp.month) - 1) return false;
    if (sp.year && c.startDate.getFullYear() !== Number(sp.year)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">History</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} records</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form className="flex flex-wrap gap-3">
          <input
            name="q"
            placeholder="Name or Emp #"
            defaultValue={sp.q}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <input
            name="month"
            type="number"
            placeholder="Month (1–12)"
            min="1"
            max="12"
            defaultValue={sp.month}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
          />
          <input
            name="year"
            type="number"
            placeholder="Year"
            defaultValue={sp.year}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
          />
          <button
            type="submit"
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Filter
          </button>
          {(sp.q || sp.month || sp.year) && (
            <Link href="/history" className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
              Clear
            </Link>
          )}
        </form>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Employee</th>
                    <th className="px-4 font-medium">Emp #</th>
                    <th className="px-4 font-medium">Type</th>
                    <th className="px-4 font-medium">Start</th>
                    <th className="px-4 font-medium">Status</th>
                    <th className="px-4 font-medium">Avg Rating</th>
                    <th className="px-4 font-medium">Slab</th>
                    <th className="px-4 font-medium">Final Hike</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">No records found</td>
                    </tr>
                  )}
                  {filtered.map((c) => {
                    const avg = c.ratings.length > 0
                      ? c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length
                      : null;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {toTitleCase(c.user.name)}
                        </td>
                        <td className="px-4 text-slate-500">{c.user.employeeNumber ?? "—"}</td>
                        <td className="px-4">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-2 py-0.5">
                            {c.type}
                          </span>
                        </td>
                        <td className="px-4 text-slate-500">{c.startDate.toLocaleDateString()}</td>
                        <td className="px-4">
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 font-medium text-slate-700 dark:text-slate-300">
                          {avg?.toFixed(2) ?? "—"}
                        </td>
                        <td className="px-4">
                          {c.decision?.slab ? (
                            <span className="text-xs text-purple-700 dark:text-purple-300">{c.decision.slab.label}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 text-green-600 font-medium">
                          {c.decision ? `+₹${Number(c.decision.finalAmount).toLocaleString()}` : "—"}
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
