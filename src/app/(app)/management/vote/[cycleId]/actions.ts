"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const schema = z.object({ cycleId: z.string(), date: z.string().min(1) });
type Result = { ok: true } | { ok: false; error: string };

export async function castVoteAction(input: z.infer<typeof schema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { cycleId, date } = parsed.data;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return { ok: false, error: "Invalid date" };

  const existing = await prisma.dateVote.findUnique({
    where: { cycleId_voterId: { cycleId, voterId: session.user.id } },
  });
  if (existing) return { ok: false, error: "Already voted" };

  await prisma.dateVote.create({
    data: { cycleId, voterId: session.user.id, date: dateObj },
  });

  revalidatePath(`/management/vote/${cycleId}`);
  return { ok: true };
}
