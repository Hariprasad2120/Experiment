"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  label: z.string().min(1),
  minRating: z.coerce.number().min(0).max(5),
  maxRating: z.coerce.number().min(0).max(5),
  hikePercent: z.coerce.number().min(0).max(100),
});

type Result = { ok: true } | { ok: false; error: string };

export async function createSlabAction(fd: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return { ok: false, error: "Forbidden" };

  const parsed = createSchema.safeParse({
    label: fd.get("label"),
    minRating: fd.get("minRating"),
    maxRating: fd.get("maxRating"),
    hikePercent: fd.get("hikePercent"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.incrementSlab.create({ data: parsed.data });
  revalidatePath("/admin/slabs");
  return { ok: true };
}

export async function deleteSlabAction(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;
  const id = fd.get("id") as string;
  if (!id) return;
  await prisma.incrementSlab.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/slabs");
}
