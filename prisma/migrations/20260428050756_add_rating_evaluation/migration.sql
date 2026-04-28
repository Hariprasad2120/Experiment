-- CreateEnum
CREATE TYPE "RatingEvaluation" AS ENUM ('ACCURATE', 'OVERRATED', 'UNDERRATED');

-- CreateTable
CREATE TABLE "RatingDisagreement" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "evaluation" "RatingEvaluation" NOT NULL,
    "comment" TEXT,
    "revisedScores" JSONB,
    "ceilingMin" DECIMAL(12,2),
    "ceilingMax" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatingDisagreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RatingDisagreement_ratingId_key" ON "RatingDisagreement"("ratingId");

-- CreateIndex
CREATE INDEX "RatingDisagreement_cycleId_idx" ON "RatingDisagreement"("cycleId");

-- AddForeignKey
ALTER TABLE "RatingDisagreement" ADD CONSTRAINT "RatingDisagreement_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingDisagreement" ADD CONSTRAINT "RatingDisagreement_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingDisagreement" ADD CONSTRAINT "RatingDisagreement_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
