-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGEMENT', 'MANAGER', 'HR', 'TL', 'EMPLOYEE', 'PARTNER');

-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('HR', 'TL', 'MANAGER');

-- CreateEnum
CREATE TYPE "CycleType" AS ENUM ('INTERIM', 'ANNUAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('PENDING_SELF', 'SELF_SUBMITTED', 'AWAITING_AVAILABILITY', 'RATING_IN_PROGRESS', 'RATINGS_COMPLETE', 'DATE_VOTING', 'SCHEDULED', 'DECIDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewerAvailability" AS ENUM ('PENDING', 'AVAILABLE', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "ExtensionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "currentSalary" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CycleType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'PENDING_SELF',
    "scheduledDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfAssessment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "editableUntil" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SelfAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CycleAssignment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "role" "ReviewerRole" NOT NULL,
    "availability" "ReviewerAvailability" NOT NULL DEFAULT 'PENDING',
    "availabilitySubmittedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CycleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "role" "ReviewerRole" NOT NULL,
    "scores" JSONB NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "comments" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateVote" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MOM" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalDecision" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "averagedRating" DOUBLE PRECISION,
    "finalRating" DOUBLE PRECISION NOT NULL,
    "slabId" TEXT,
    "suggestedAmount" DECIMAL(12,2) NOT NULL,
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "comments" TEXT,
    "decidedById" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppraisalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementSlab" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minRating" DOUBLE PRECISION NOT NULL,
    "maxRating" DOUBLE PRECISION NOT NULL,
    "hikePercent" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IncrementSlab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionRequest" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ExtensionStatus" NOT NULL DEFAULT 'PENDING',
    "extendedUntil" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE INDEX "AppraisalCycle_userId_status_idx" ON "AppraisalCycle"("userId", "status");

-- CreateIndex
CREATE INDEX "AppraisalCycle_startDate_idx" ON "AppraisalCycle"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "SelfAssessment_cycleId_key" ON "SelfAssessment"("cycleId");

-- CreateIndex
CREATE INDEX "CycleAssignment_reviewerId_active_idx" ON "CycleAssignment"("reviewerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CycleAssignment_cycleId_role_active_key" ON "CycleAssignment"("cycleId", "role", "active");

-- CreateIndex
CREATE INDEX "Rating_reviewerId_idx" ON "Rating"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_cycleId_role_key" ON "Rating"("cycleId", "role");

-- CreateIndex
CREATE INDEX "DateVote_cycleId_date_idx" ON "DateVote"("cycleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DateVote_cycleId_voterId_key" ON "DateVote"("cycleId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "MOM_cycleId_key" ON "MOM"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "AppraisalDecision_cycleId_key" ON "AppraisalDecision"("cycleId");

-- CreateIndex
CREATE INDEX "IncrementSlab_minRating_maxRating_idx" ON "IncrementSlab"("minRating", "maxRating");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_cycleId_createdAt_idx" ON "AuditLog"("cycleId", "createdAt");

-- AddForeignKey
ALTER TABLE "AppraisalCycle" ADD CONSTRAINT "AppraisalCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfAssessment" ADD CONSTRAINT "SelfAssessment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleAssignment" ADD CONSTRAINT "CycleAssignment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleAssignment" ADD CONSTRAINT "CycleAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CycleAssignment" ADD CONSTRAINT "CycleAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateVote" ADD CONSTRAINT "DateVote_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateVote" ADD CONSTRAINT "DateVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MOM" ADD CONSTRAINT "MOM_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalDecision" ADD CONSTRAINT "AppraisalDecision_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalDecision" ADD CONSTRAINT "AppraisalDecision_slabId_fkey" FOREIGN KEY ("slabId") REFERENCES "IncrementSlab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalDecision" ADD CONSTRAINT "AppraisalDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionRequest" ADD CONSTRAINT "ExtensionRequest_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionRequest" ADD CONSTRAINT "ExtensionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionRequest" ADD CONSTRAINT "ExtensionRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
