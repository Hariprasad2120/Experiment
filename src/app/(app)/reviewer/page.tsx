import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVisibleAverageForReviewer, isRatingOpen, isReviewWindowOpen } from "@/lib/workflow";
import { toTitleCase } from "@/lib/utils";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import { CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";

export default async function ReviewerDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const assignments = await prisma.cycleAssignment.findMany({
    where: { reviewerId: session.user.id },
    include: {
      cycle: {
        include: {
          user: true,
          self: true,
          assignments: { select: { availability: true } },
          ratings: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const pending = assignments.filter((a) => a.availability === "PENDING");
  const available = assignments.filter((a) => a.availability === "AVAILABLE");
  const notAvailable = assignments.filter((a) => a.availability === "NOT_AVAILABLE");

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">
            {assignments.length} total assignment{assignments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </FadeIn>

      {assignments.length === 0 && (
        <FadeIn delay={0.1}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-slate-400">
              No assignments yet. Admin will assign you when a cycle opens.
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {pending.length > 0 && (
        <FadeIn delay={0.1}>
          <div>
            <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="size-4" /> Action Required ({pending.length})
            </h2>
            <StaggerList className="grid gap-3 sm:grid-cols-2">
              {pending.map((a) => (
                <StaggerItem key={a.id}>
                  <ReviewCard assignment={a} sessionUserId={session.user.id} />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </FadeIn>
      )}

      {available.length > 0 && (
        <FadeIn delay={0.15}>
          <div>
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="size-4" /> In Progress ({available.length})
            </h2>
            <StaggerList className="grid gap-3 sm:grid-cols-2">
              {available.map((a) => (
                <StaggerItem key={a.id}>
                  <ReviewCard assignment={a} sessionUserId={session.user.id} />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </FadeIn>
      )}

      {notAvailable.length > 0 && (
        <FadeIn delay={0.2}>
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Not Available ({notAvailable.length})
            </h2>
            <StaggerList className="grid gap-3 sm:grid-cols-2">
              {notAvailable.map((a) => (
                <StaggerItem key={a.id}>
                  <ReviewCard assignment={a} sessionUserId={session.user.id} />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

function ReviewCard({
  assignment,
  sessionUserId,
}: {
  assignment: {
    id: string;
    role: string;
    availability: string;
    cycle: {
      id: string;
      type: string;
      user: { name: string; department: string | null };
      self: { editableUntil: Date; submittedAt: Date | null; locked: boolean } | null;
      assignments: { availability: "PENDING" | "AVAILABLE" | "NOT_AVAILABLE" }[];
      ratings: { reviewerId: string; averageScore: number }[];
    };
  };
  sessionUserId: string;
}) {
  const reviewOpen = isReviewWindowOpen(assignment.cycle);
  const ratingOpen = isRatingOpen(assignment.cycle);
  const iRated = assignment.cycle.ratings.some((r) => r.reviewerId === sessionUserId);
  const visibleAverage = getVisibleAverageForReviewer(assignment.cycle.ratings, sessionUserId);

  const statusColor = {
    PENDING: "border-l-amber-400",
    AVAILABLE: "border-l-blue-400",
    NOT_AVAILABLE: "border-l-slate-300",
  }[assignment.availability] ?? "border-l-slate-300";

  return (
    <Card className={`border-0 shadow-sm border-l-4 ${statusColor} h-full`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {toTitleCase(assignment.cycle.user.name)}
            </div>
            <div className="text-xs text-slate-400">{assignment.cycle.user.department ?? "—"}</div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5">
              {assignment.role}
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">{assignment.cycle.type}</div>
          </div>
        </div>

        {visibleAverage !== null && (
          <div className="text-xs text-green-600 font-medium">
            Avg: {visibleAverage.toFixed(2)}
          </div>
        )}

        {!reviewOpen && (
          <p className="text-xs text-slate-400">Waiting for self-assessment</p>
        )}

        <div className="flex gap-2 flex-wrap">
          {assignment.availability === "PENDING" && (
            <Link
              href={`/reviewer/${assignment.cycle.id}/availability`}
              className="text-xs bg-amber-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-amber-600 transition-colors flex items-center gap-1"
            >
              Set Availability <ChevronRight className="size-3" />
            </Link>
          )}
          {assignment.availability === "AVAILABLE" && ratingOpen && !iRated && (
            <Link
              href={`/reviewer/${assignment.cycle.id}/rate`}
              className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              Rate Employee <ChevronRight className="size-3" />
            </Link>
          )}
          {iRated && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="size-3.5" /> Rated
            </span>
          )}
          <Link
            href={`/reviewer/${assignment.cycle.id}`}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
