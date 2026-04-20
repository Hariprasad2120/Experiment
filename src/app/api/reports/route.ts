import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")
  const department = searchParams.get("department")
  const search = searchParams.get("search")
  const status = searchParams.get("status")

  const appraisals = await prisma.appraisal.findMany({
    where: {
      status: "COMPLETED",
      ...(month && { cycleMonth: parseInt(month) }),
      ...(year && { cycleYear: parseInt(year) }),
      ...(status && { status: status as never }),
      ...(department && { employee: { department } }),
      ...(search && {
        employee: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { empId: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    },
    include: {
      employee: { select: { empId: true, name: true, department: true } },
      mom: { select: { finalRating: true, increment: true } },
      ratings: { select: { overallRating: true } },
    },
    orderBy: [{ cycleYear: "desc" }, { cycleMonth: "desc" }],
  })

  return NextResponse.json(appraisals)
}
