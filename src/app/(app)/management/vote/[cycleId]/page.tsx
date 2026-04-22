import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion-div";
import { toTitleCase } from "@/lib/utils";
import { VoteForm } from "./vote-form";
import { CheckCircle } from "lucide-react";

export default async function VotePage({ params }: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const cycle = await prisma.appraisalCycle.findUnique({
    where: { id: cycleId },
    include: {
      user: true,
      votes: { include: { voter: { select: { name: true, role: true } } } },
      assignments: { include: { reviewer: { select: { id: true, name: true } } } },
    },
  });
  if (!cycle) notFound();

  const myVote = cycle.votes.find((v) => v.voterId === session.user.id);

  const voteCounts = cycle.votes.reduce<Record<string, number>>((acc, v) => {
    const d = v.date.toISOString().split("T")[0];
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  const winningDate = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-5 max-w-xl">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Schedule Appraisal Meeting
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {toTitleCase(cycle.user.name)} — vote for a meeting date
          </p>
        </div>
      </FadeIn>

      {winningDate && (
        <FadeIn delay={0.1}>
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-sm text-purple-700 dark:text-purple-400 font-medium">
            Leading date: {new Date(winningDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} ({voteCounts[winningDate]} vote{voteCounts[winningDate] > 1 ? "s" : ""})
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.15}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Votes Cast</CardTitle>
          </CardHeader>
          <CardContent>
            {cycle.votes.length === 0 ? (
              <p className="text-sm text-slate-400">No votes yet.</p>
            ) : (
              <div className="space-y-2">
                {cycle.votes.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{toTitleCase(v.voter.name)} ({v.voter.role})</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {v.date.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        {myVote ? (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle className="size-4" />
            You voted: {myVote.date.toLocaleDateString()}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cast Your Vote</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteForm cycleId={cycleId} />
            </CardContent>
          </Card>
        )}
      </FadeIn>
    </div>
  );
}
