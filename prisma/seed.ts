import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const hash = (p: string) => bcrypt.hash(p, 12)

  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: { name: "Admin User", email: "admin@company.com", password: await hash("admin123"), role: "ADMIN" },
  })

  // Create evaluators
  const hr = await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: { name: "Sarah HR", email: "hr@company.com", password: await hash("hr123"), role: "HR" },
  })

  const tl = await prisma.user.upsert({
    where: { email: "tl@company.com" },
    update: {},
    create: { name: "Tom TL", email: "tl@company.com", password: await hash("tl123"), role: "TL" },
  })

  const manager = await prisma.user.upsert({
    where: { email: "manager@company.com" },
    update: {},
    create: { name: "Mike Manager", email: "manager@company.com", password: await hash("manager123"), role: "MANAGER" },
  })

  // Create employee user
  const empUser = await prisma.user.upsert({
    where: { email: "john@company.com" },
    update: {},
    create: { name: "John Doe", email: "john@company.com", password: await hash("emp123"), role: "EMPLOYEE" },
  })

  // Create employee record (joined 1 year ago - eligible this month)
  const joiningDate = new Date()
  joiningDate.setFullYear(joiningDate.getFullYear() - 1)

  const employee = await prisma.employee.upsert({
    where: { empId: "EMP001" },
    update: {},
    create: {
      empId: "EMP001",
      name: "John Doe",
      email: "john@company.com",
      department: "Engineering",
      joiningDate,
      userId: empUser.id,
    },
  })

  // Create a sample appraisal
  const now = new Date()
  const appraisal = await prisma.appraisal.upsert({
    where: {
      employeeId_cycleMonth_cycleYear: {
        employeeId: employee.id,
        cycleMonth: now.getMonth() + 1,
        cycleYear: now.getFullYear(),
      },
    },
    update: {},
    create: {
      employeeId: employee.id,
      cycleMonth: now.getMonth() + 1,
      cycleYear: now.getFullYear(),
      status: "ASSIGNED",
    },
  })

  // Create assignment
  await prisma.assignment.upsert({
    where: { appraisalId: appraisal.id },
    update: {},
    create: {
      appraisalId: appraisal.id,
      hrId: hr.id,
      tlId: tl.id,
      managerId: manager.id,
    },
  })

  // Create availability records
  for (const evaluatorId of [hr.id, tl.id, manager.id]) {
    await prisma.availability.upsert({
      where: { appraisalId_evaluatorId: { appraisalId: appraisal.id, evaluatorId } },
      update: {},
      create: { appraisalId: appraisal.id, evaluatorId, status: "PENDING" },
    })
  }

  console.log("✅ Seed complete!")
  console.log("\nLogin credentials:")
  console.log("  Admin:   admin@company.com / admin123")
  console.log("  HR:      hr@company.com / hr123")
  console.log("  TL:      tl@company.com / tl123")
  console.log("  Manager: manager@company.com / manager123")
  console.log("  Employee: john@company.com / emp123")
}

main().catch(console.error).finally(() => prisma.$disconnect())
