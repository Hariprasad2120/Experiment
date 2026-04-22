import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isRatingOpen } from "@/lib/workflow";
import { RateForm } from "./rate-form";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";

export const CRITERIA = [
  "Job Knowledge",
  "Quality of Work",
  "Communication",
  "Teamwork",
  "Initiative",
  "Reliability",
  "Attitude & Professionalism",
];

export default async function RatePage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const assignment = await prisma.cycleAssignment.findFirst({
    where: { cycleId, reviewerId: session.user.id },
    include: {
      cycle: {
        include: {
          user: true,
          self: true,
          assignments: { select: { availability: true } },
        },
      },
    },
  });
  if (!assignment) notFound();
  if (assignment.availability !== "AVAILABLE") redirect(`/reviewer/${cycleId}`);
  if (!isRatingOpen(assignment.cycle)) redirect(`/reviewer/${cycleId}`);

  const existing = await prisma.rating.findFirst({ where: { cycleId, reviewerId: session.user.id } });
  if (existing) redirect(`/reviewer/${cycleId}`);

  const peerRatingExists = await prisma.rating.count({ where: { cycleId } }) > 0;

  return (
    <div className="max-w-2xl space-y-5">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Rate {toTitleCase(assignment.cycle.user.name)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Role: {assignment.role} · {assignment.cycle.type} cycle
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <RateForm
          cycleId={cycleId}
          role={assignment.role}
          criteria={CRITERIA}
          peerRatingExists={peerRatingExists}
        />
      </FadeIn>
    </div>
  );
}
