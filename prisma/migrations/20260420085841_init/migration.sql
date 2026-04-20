-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'TL', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('PENDING', 'ASSIGNED', 'AVAILABILITY_PENDING', 'RATING_IN_PROGRESS', 'VOTING', 'SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('PENDING', 'AVAILABLE', 'NOT_AVAILABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appraisal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleMonth" INTEGER NOT NULL,
    "cycleYear" INTEGER NOT NULL,
    "status" "AppraisalStatus" NOT NULL DEFAULT 'PENDING',
    "finalDate" TIMESTAMP(3),
    "finalRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "hrId" TEXT NOT NULL,
    "tlId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'PENDING',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "selectedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MOM" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "finalRating" DOUBLE PRECISION,
    "increment" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MOM_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_empId_key" ON "Employee"("empId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Appraisal_employeeId_cycleMonth_cycleYear_key" ON "Appraisal"("employeeId", "cycleMonth", "cycleYear");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_appraisalId_key" ON "Assignment"("appraisalId");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_appraisalId_evaluatorId_key" ON "Availability"("appraisalId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_appraisalId_evaluatorId_key" ON "Rating"("appraisalId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_appraisalId_evaluatorId_key" ON "Vote"("appraisalId", "evaluatorId");

-- CreateIndex
CREATE UNIQUE INDEX "MOM_appraisalId_key" ON "MOM"("appraisalId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_tlId_fkey" FOREIGN KEY ("tlId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
