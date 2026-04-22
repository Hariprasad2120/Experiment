"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { syncCycleStatus } from "@/lib/workflow";

const schema = z.object({
  assignmentId: z.string(),
  choice: z.enum(["AVAILABLE", "NOT_AVAILABLE"]),
});

type Result = { ok: true } | { ok: false; error: string };

export async function submitAvailabilityAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const assignment = await prisma.cycleAssignment.findUnique({
    where: { id: parsed.data.assignmentId },
  });
  if (!assignment || assignment.reviewerId !== session.user.id) {
    return { ok: false, error: "Forbidden" };
  }
  if (assignment.availability !== "PENDING") {
    return { ok: false, error: "Already submitted" };
  }

  await prisma.cycleAssignment.update({
    where: { id: assignment.id },
    data: {
      availability: parsed.data.choice,
      availabilitySubmittedAt: new Date(),
    },
  });

  if (parsed.data.choice === "NOT_AVAILABLE") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "REASSIGN_NEEDED",
          message: `Reviewer marked NOT_AVAILABLE for cycle ${assignment.cycleId}`,
          link: `/admin/cycles/${assignment.cycleId}`,
        },
      });
    }
  }

  await syncCycleStatus(assignment.cycleId);
  revalidatePath(`/reviewer/${assignment.cycleId}`);
  revalidatePath("/reviewer");
  return { ok: true };
}
