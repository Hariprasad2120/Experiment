-- DropIndex
DROP INDEX "CycleAssignment_cycleId_role_active_key";
DROP INDEX "CycleAssignment_reviewerId_active_idx";

-- AlterTable
ALTER TABLE "CycleAssignment" DROP COLUMN "active";

-- CreateIndex
CREATE UNIQUE INDEX "CycleAssignment_cycleId_role_key" ON "CycleAssignment"("cycleId", "role");
CREATE INDEX "CycleAssignment_reviewerId_idx" ON "CycleAssignment"("reviewerId");
