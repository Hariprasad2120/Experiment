-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secondaryRole" "Role";

-- CreateTable
CREATE TABLE "SalaryRevision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "grossAnnum" DECIMAL(12,2) NOT NULL,
    "ctcAnnum" DECIMAL(12,2) NOT NULL,
    "revisedCtc" DECIMAL(12,2) NOT NULL,
    "isCTCChangedByPerc" BOOLEAN NOT NULL DEFAULT false,
    "revisionPercentage" DECIMAL(6,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "payoutMonth" TIMESTAMP(3) NOT NULL,
    "basic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transport" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "travelling" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fixedAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stipend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriteriaOverride" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "CriteriaOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingReview" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "criteriaName" TEXT NOT NULL,
    "originalScore" DOUBLE PRECISION NOT NULL,
    "revisedScore" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatingReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryRevision_userId_effectiveFrom_idx" ON "SalaryRevision"("userId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "CriteriaOverride_categoryName_key" ON "CriteriaOverride"("categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "RatingReview_ratingId_criteriaName_key" ON "RatingReview"("ratingId", "criteriaName");

-- CreateIndex
CREATE INDEX "RatingReview_cycleId_idx" ON "RatingReview"("cycleId");

-- AddForeignKey
ALTER TABLE "SalaryRevision" ADD CONSTRAINT "SalaryRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriteriaOverride" ADD CONSTRAINT "CriteriaOverride_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingReview" ADD CONSTRAINT "RatingReview_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingReview" ADD CONSTRAINT "RatingReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingReview" ADD CONSTRAINT "RatingReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
