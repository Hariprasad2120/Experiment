"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { addBusinessDays } from "@/lib/business-days";

type Result = { ok: true } | { ok: false; error: string };

export async function decideExtensionAction(
  extensionId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<Result> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return { ok: false, error: "Forbidden" };

  const ext = await prisma.extensionRequest.findUnique({
    where: { id: extensionId },
    include: { cycle: { include: { assignments: true } } },
  });
  if (!ext) return { ok: false, error: "Not found" };
  if (ext.status !== "PENDING") return { ok: false, error: "Already decided" };

  const extendedUntil = decision === "APPROVED" ? addBusinessDays(new Date(), 2) : null;

  await prisma.extensionRequest.update({
    where: { id: extensionId },
    data: {
      status: decision,
      extendedUntil,
      decidedById: session.user.id,
      updatedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: ext.requesterId,
      type: "EXTENSION_DECISION",
      message: `Your extension request was ${decision.toLowerCase()}`,
      link: `/reviewer/${ext.cycleId}`,
    },
  });

  revalidatePath("/admin/extensions");
  return { ok: true };
}
