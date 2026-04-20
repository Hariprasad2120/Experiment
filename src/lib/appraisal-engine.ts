import { prisma } from "@/lib/prisma"

const WINDOW_DAYS = 7

export function isEligibleThisMonth(joiningDate: Date, referenceDate: Date = new Date()): boolean {
  const refDay = referenceDate.getDate()
  const refMonth = referenceDate.getMonth() + 1
  const refYear = referenceDate.getFullYear()

  const joinDay = joiningDate.getDate()
  const joinMonth = joiningDate.getMonth() + 1

  // Check if this month matches the joining anniversary month (±7 days)
  const anniversary = new Date(refYear, joinMonth - 1, joinDay)
  const windowStart = new Date(refYear, refMonth - 1, refDay - WINDOW_DAYS)
  const windowEnd = new Date(refYear, refMonth - 1, refDay + WINDOW_DAYS)

  // The anniversary of joining in the current year
  const thisYearAnniversary = new Date(refYear, joiningDate.getMonth(), joiningDate.getDate())
  const yearsWorked = refYear - joiningDate.getFullYear()

  if (yearsWorked < 1) return false

  return thisYearAnniversary >= windowStart && thisYearAnniversary <= windowEnd
}

export async function detectEligibleEmployees(): Promise<{
  created: number
  skipped: number
  errors: string[]
}> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const errors: string[] = []
  let created = 0
  let skipped = 0

  const employees = await prisma.employee.findMany()

  for (const employee of employees) {
    try {
      if (!isEligibleThisMonth(employee.joiningDate, now)) {
        skipped++
        continue
      }

      // Check if appraisal already exists for this cycle
      const existing = await prisma.appraisal.findUnique({
        where: {
          employeeId_cycleMonth_cycleYear: {
            employeeId: employee.id,
            cycleMonth: currentMonth,
            cycleYear: currentYear,
          },
        },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.appraisal.create({
        data: {
          employeeId: employee.id,
          cycleMonth: currentMonth,
          cycleYear: currentYear,
          status: "PENDING",
        },
      })
      created++
    } catch (err) {
      errors.push(`Employee ${employee.empId}: ${String(err)}`)
    }
  }

  return { created, skipped, errors }
}
