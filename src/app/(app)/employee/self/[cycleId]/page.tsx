import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelfForm } from "./self-form";

const QUESTIONS = [
  "Key accomplishments this period",
  "Challenges faced",
  "Skills developed",
  "Goals for next period",
];

export default async function SelfPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: { self: true, user: true },
  });
  if (!cycle || cycle.userId !== session.user.id) notFound();
  if (!cycle.self) notFound();

  const locked = cycle.self.locked || new Date() > cycle.self.editableUntil;
  const existing = (cycle.self.answers as Record<string, string>) ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Self-Assessment — {cycle.type}</CardTitle>
      </CardHeader>
      <CardContent>
        {locked ? (
          <p className="text-sm">This self-assessment is locked.</p>
        ) : (
          <SelfForm
            cycleId={cycleId}
            questions={QUESTIONS}
            existing={existing}
            editableUntil={cycle.self.editableUntil.toISOString()}
          />
        )}
      </CardContent>
    </Card>
  );
}
