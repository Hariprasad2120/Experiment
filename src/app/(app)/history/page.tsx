import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import Link from "next/link";
import { HistoryFilters } from "./history-filters";

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
  searchParams: Promise<{ month?: string; year?: string; q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role;
  const secondaryRole = session.user.secondaryRole;
  const isReviewerRole = ["HR", "TL", "MANAGER"].includes(role);
  const isAdminRole = role === "ADMIN" || secondaryRole === "ADMIN";
  const isManagementOrPartner = role === "MANAGEMENT" || role === "PARTNER";

  const where: Record<string, unknown> = {};

  if (isManagementOrPartner || isAdminRole) {
    // see all
  } else if (isReviewerRole) {
    // reviewer sees ONLY cycles they were assigned to review
    where.assignments = { some: { reviewerId: session.user.id } };
  } else {
    // EMPLOYEE sees only own
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

  if (sp.status) {
    where.status = sp.status;
  }

  const cycles = await prisma.appraisalCycle.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, employeeNumber: true, department: true } },
      decision: { include: { slab: true } },
      ratings: { select: { averageScore: true, role: true, reviewerId: true } },
      assignments: { select: { reviewerId: true, reviewer: { select: { name: true } } } },
    },
    orderBy: { startDate: "desc" },
    take: 200,
  });

  const filtered = cycles.filter((c) => {
    if (sp.month && c.startDate.getMonth() !== Number(sp.month) - 1) return false;
    if (sp.year && c.startDate.getFullYear() !== Number(sp.year)) return false;
    return true;
  });

  const canViewEmployeeDetail = isAdminRole || isManagementOrPartner;
  const canViewCycleDetail = isAdminRole || isManagementOrPartner;

  return (
    <div className="space-y-5">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isReviewerRole ? "My Review History" : "Appraisal History"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isReviewerRole
              ? "Appraisals you were assigned to review"
              : `${filtered.length} records`}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.07}>
        <HistoryFilters
          defaultQ={sp.q}
          defaultMonth={sp.month}
          defaultYear={sp.year}
          defaultStatus={sp.status}
          showSearch={!isReviewerRole || isAdminRole || isManagementOrPartner}
        />
      </FadeIn>

      <FadeIn delay={0.12}>
        <p className="text-xs text-slate-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Employee</th>
                    {(isAdminRole || isManagementOrPartner) && (
                      <th className="px-4 font-medium">Emp #</th>
                    )}
                    <th className="px-4 font-medium">Type</th>
                    <th className="px-4 font-medium">Start</th>
                    <th className="px-4 font-medium">Status</th>
                    <th className="px-4 font-medium">Avg Rating</th>
                    <th className="px-4 font-medium">Grade</th>
                    <th className="px-4 font-medium">Slab</th>
                    <th className="px-4 font-medium">Final Hike</th>
                    {isReviewerRole && <th className="px-4 font-medium">My Rating</th>}
                    {canViewCycleDetail && <th className="px-4 font-medium">Detail</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No records found
                      </td>
                    </tr>
                  )}
                  {filtered.map((c) => {
                    const avg =
                      c.ratings.length > 0
                        ? c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length
                        : null;
                    const myRating = isReviewerRole
                      ? c.ratings.find((r) => r.reviewerId === session.user.id)
                      : null;

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {canViewEmployeeDetail ? (
                            <Link
                              href={`/admin/employees/${c.user.id}`}
                              className="hover:text-[#008993] transition-colors"
                            >
                              {toTitleCase(c.user.name)}
                            </Link>
                          ) : (
                            toTitleCase(c.user.name)
                          )}
                        </td>
                        {(isAdminRole || isManagementOrPartner) && (
                          <td className="px-4 text-slate-500">{c.user.employeeNumber ?? "—"}</td>
                        )}
                        <td className="px-4">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-2 py-0.5">
                            {c.type}
                          </span>
                        </td>
                        <td className="px-4 text-slate-500 whitespace-nowrap">
                          {c.startDate.toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4">
                          <span
                            className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 font-medium text-slate-700 dark:text-slate-300">
                          {avg !== null ? avg.toFixed(2) : "—"}
                        </td>
                        <td className="px-4">
                          {c.decision?.slab?.grade ? (
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                              {c.decision.slab.grade}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4">
                          {c.decision?.slab ? (
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              {c.decision.slab.label}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 text-green-600 font-medium whitespace-nowrap">
                          {c.decision
                            ? `+₹${Number(c.decision.finalAmount).toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        {isReviewerRole && (
                          <td className="px-4 text-slate-500">
                            {myRating ? (
                              <span className="font-semibold text-[#008993]">
                                {myRating.averageScore.toFixed(1)}
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        {canViewCycleDetail && (
                          <td className="px-4">
                            <Link
                              href={`/admin/cycles/${c.id}`}
                              className="text-xs text-[#008993] hover:text-[#00cec4] font-medium"
                            >
                              View →
                            </Link>
                          </td>
                        )}
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
