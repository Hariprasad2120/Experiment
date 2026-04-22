"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const schema = z.object({
  cycleId: z.string(),
  reason: z.string().min(1),
});

type Result = { ok: true } | { ok: false; error: string };

export async function requestExtensionAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { cycleId, reason } = parsed.data;

  const assignment = await prisma.cycleAssignment.findFirst({
    where: { cycleId, reviewerId: session.user.id },
  });
  if (!assignment) return { ok: false, error: "Not assigned to this cycle" };

  const existing = await prisma.extensionRequest.findFirst({
    where: { cycleId, requesterId: session.user.id, status: "PENDING" },
  });
  if (existing) return { ok: false, error: "Extension already requested" };

  await prisma.extensionRequest.create({
    data: { cycleId, requesterId: session.user.id, reason },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "EXTENSION_REQUEST",
        message: `Extension requested for cycle by ${session.user.name ?? "reviewer"}`,
        link: "/admin/extensions",
      },
    });
  }

  revalidatePath(`/reviewer/${cycleId}`);
  return { ok: true };
}
