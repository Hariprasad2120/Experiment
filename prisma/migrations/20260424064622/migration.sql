/*
  Warnings:

  - A unique constraint covering the columns `[employeeNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "IncrementSlab" ADD COLUMN     "grade" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "salaryTier" TEXT NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "postComment" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadhaar" TEXT,
ADD COLUMN     "accountType" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "employeeNumber" INTEGER,
ADD COLUMN     "employeeStatus" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "ifsc" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "permanentAddress" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "personalPhone" TEXT,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "presentAddress" TEXT,
ADD COLUMN     "reportingManagerId" TEXT,
ADD COLUMN     "sourceOfHire" TEXT,
ADD COLUMN     "stateCode" TEXT,
ADD COLUMN     "uan" TEXT,
ADD COLUMN     "workPhone" TEXT,
ADD COLUMN     "zohoRole" TEXT;

-- CreateTable
CREATE TABLE "EmployeeSalary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grossAnnum" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ctcAnnum" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "basic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transport" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "travelling" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fixedAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stipend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalary_userId_key" ON "EmployeeSalary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeNumber_key" ON "User"("employeeNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalary" ADD CONSTRAINT "EmployeeSalary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
