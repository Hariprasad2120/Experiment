import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { IndianRupee, TrendingUp, Users, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SalaryRevisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ emp?: string; status?: string; sort?: string }>;
}) {
  const { emp, status, sort } = await searchParams;

  const byDate = sort === "date";

  const revisions = await prisma.salaryRevision.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(emp
        ? { user: { employeeNumber: Number(emp) } }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, employeeNumber: true, department: true, designation: true } },
    },
    orderBy: byDate
      ? [{ effectiveFrom: "desc" }, { user: { employeeNumber: "asc" } }]
      : [{ user: { employeeNumber: "asc" } }, { effectiveFrom: "desc" }],
  });

  const totalApproved = revisions.filter((r) => r.status === "Approved").length;
  const totalPending  = revisions.filter((r) => r.status === "Pending").length;
  const totalRejected = revisions.filter((r) => r.status === "Rejected").length;
  const uniqueEmps    = new Set(revisions.map((r) => r.userId)).size;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtMonth = (d: Date) =>
    d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  const statusColors: Record<string, string> = {
    Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="size-6 text-[#008993]" /> Salary Revisions
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {revisions.length} revision{revisions.length !== 1 ? "s" : ""} across {uniqueEmps} employee{uniqueEmps !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/admin/appraisals" className="text-xs text-slate-400 hover:text-slate-600">
            ← Appraisals
          </Link>
        </div>
      </FadeIn>

      {/* Summary cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Revisions", value: revisions.length, icon: IndianRupee, color: "text-[#008993]", bg: "bg-[#008993]/10" },
            { label: "Employees",       value: uniqueEmps,        icon: Users,        color: "text-blue-600",  bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Approved",        value: totalApproved,     icon: CheckCircle,  color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
            { label: "Pending",         value: totalPending,      icon: TrendingUp,   color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`inline-flex rounded-lg p-1.5 ${s.bg} mb-2`}>
                  <s.icon className={`size-4 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>

      {/* Filter bar */}
      <FadeIn delay={0.08}>
        <div className="flex flex-wrap gap-2 text-xs items-center">
          {["", "Approved", "Pending", "Rejected"].map((s) => {
            const params = new URLSearchParams();
            if (s) params.set("status", s);
            if (emp) params.set("emp", emp);
            if (byDate) params.set("sort", "date");
            const href = `/admin/salary-revisions${params.toString() ? `?${params}` : ""}`;
            return (
              <Link
                key={s || "all"}
                href={href}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  (status ?? "") === s
                    ? "bg-[#008993] text-white border-[#008993]"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#008993] hover:text-[#008993]"
                }`}
              >
                {s || "All"}
              </Link>
            );
          })}

          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Sort toggle */}
          {(() => {
            const params = new URLSearchParams();
            if (status) params.set("status", status);
            if (emp) params.set("emp", emp);
            if (!byDate) params.set("sort", "date");
            return (
              <Link
                href={`/admin/salary-revisions${params.toString() ? `?${params}` : ""}`}
                className={`px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${
                  byDate
                    ? "bg-[#ff8333] text-white border-[#ff8333]"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#ff8333] hover:text-[#ff8333]"
                }`}
              >
                {byDate ? "↓ By Date" : "↕ By Emp #"}
              </Link>
            );
          })()}

          {emp && (
            <Link
              href="/admin/salary-revisions"
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-400 hover:text-red-500 transition-colors"
            >
              Clear filter ×
            </Link>
          )}
        </div>
      </FadeIn>

      {/* Main table */}
      <FadeIn delay={0.1}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revision Records ({revisions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Emp #</th>
                    <th className="px-4 font-medium">Name</th>
                    <th className="px-4 font-medium">Department</th>
                    <th className="px-4 font-medium">{byDate ? "↓ " : ""}Effective</th>
                    <th className="px-4 font-medium">Payout</th>
                    <th className="px-4 font-medium">Gross</th>
                    <th className="px-4 font-medium">CTC</th>
                    <th className="px-4 font-medium">Revised CTC</th>
                    <th className="px-4 font-medium">Rev %</th>
                    <th className="px-4 font-medium">Basic</th>
                    <th className="px-4 font-medium">HRA</th>
                    <th className="px-4 font-medium">Travelling</th>
                    <th className="px-4 font-medium">Fixed Allw.</th>
                    <th className="px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {revisions.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400">
                        No revision records found.
                      </td>
                    </tr>
                  ) : (
                    revisions.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-4 text-slate-500">
                          <Link
                            href={`/admin/salary-revisions?emp=${r.user.employeeNumber ?? ""}`}
                            className="hover:text-[#008993] transition-colors"
                          >
                            {r.user.employeeNumber ?? "—"}
                          </Link>
                        </td>
                        <td className="px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          <Link href={`/admin/employees/${r.user.id}`} className="hover:text-[#008993] transition-colors">
                            {toTitleCase(r.user.name)}
                          </Link>
                        </td>
                        <td className="px-4 text-slate-500 whitespace-nowrap">{r.user.department ?? "—"}</td>
                        <td className="px-4 text-slate-600 whitespace-nowrap">{fmtMonth(r.effectiveFrom)}</td>
                        <td className="px-4 text-slate-600 whitespace-nowrap">{fmtMonth(r.payoutMonth)}</td>
                        <td className="px-4 text-slate-700 dark:text-slate-300">{fmt(Number(r.grossAnnum))}</td>
                        <td className="px-4 text-slate-700 dark:text-slate-300">{fmt(Number(r.ctcAnnum))}</td>
                        <td className="px-4 font-semibold text-slate-900 dark:text-white">{fmt(Number(r.revisedCtc))}</td>
                        <td className="px-4">
                          {r.revisionPercentage ? (
                            <span className="text-green-600 font-medium">{Number(r.revisionPercentage)}%</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 text-slate-600">{Number(r.basic) > 0 ? fmt(Number(r.basic)) : "—"}</td>
                        <td className="px-4 text-slate-600">{Number(r.hra) > 0 ? fmt(Number(r.hra)) : "—"}</td>
                        <td className="px-4 text-slate-600">{Number(r.travelling) > 0 ? fmt(Number(r.travelling)) : "—"}</td>
                        <td className="px-4 text-slate-600">{Number(r.fixedAllowance) > 0 ? fmt(Number(r.fixedAllowance)) : "—"}</td>
                        <td className="px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[r.status] ?? ""}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {totalRejected > 0 && (
        <FadeIn delay={0.15}>
          <p className="text-xs text-slate-400 text-center">
            {totalRejected} rejected revision{totalRejected !== 1 ? "s" : ""} hidden from approved count.
          </p>
        </FadeIn>
      )}
    </div>
  );
}
