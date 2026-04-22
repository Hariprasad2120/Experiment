import { prisma } from "@/lib/db";
import { FadeIn } from "@/components/motion-div";
import { SalaryCalculator } from "./salary-calculator";

export default async function SalaryPage() {
  const [slabs, readyCycles] = await Promise.all([
    prisma.incrementSlab.findMany({ orderBy: { minRating: "desc" } }),
    prisma.appraisalCycle.findMany({
      where: { status: { in: ["RATINGS_COMPLETE", "DATE_VOTING", "SCHEDULED", "DECIDED"] } },
      include: {
        user: { include: { salary: true } },
        ratings: true,
        decision: { include: { slab: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const employees = readyCycles.map((c) => {
    const avg = c.ratings.length > 0
      ? c.ratings.reduce((s, r) => s + r.averageScore, 0) / c.ratings.length
      : 0;
    const slab = slabs.find((s) => avg >= s.minRating && avg <= s.maxRating);
    return {
      id: c.id,
      userId: c.user.id,
      name: c.user.name,
      department: c.user.department ?? "—",
      avgRating: avg,
      hikePercent: slab?.hikePercent ?? 0,
      slabLabel: slab?.label ?? "—",
      grossAnnum: c.user.salary ? Number(c.user.salary.grossAnnum) : 0,
      decided: c.status === "DECIDED",
      finalAmount: c.decision ? Number(c.decision.finalAmount) : null,
    };
  });

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Salary Impact Calculator</h1>
          <p className="text-slate-500 text-sm mt-1">
            Live salary increment preview based on appraisal ratings
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <SalaryCalculator employees={employees} slabs={slabs} />
      </FadeIn>
    </div>
  );
}
