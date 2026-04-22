import type { CycleType } from "@/generated/prisma/enums";

export type EligibilityResult =
  | { eligible: true; cycleType: CycleType; reason: string }
  | { eligible: false; reason: string };

export type MilestoneAlert =
  | { type: "EPF_ESI"; label: string }
  | { type: "TRAINING_COMPLETE"; label: string }
  | null;

/** Months between two dates (floor). */
function monthsSince(joining: Date, ref: Date): number {
  return (
    (ref.getFullYear() - joining.getFullYear()) * 12 +
    (ref.getMonth() - joining.getMonth())
  );
}

/** True if the date at `targetMonth` offset from joining falls in `ref` month. */
function milestoneDueThisMonth(joining: Date, targetMonths: number, ref: Date): boolean {
  const milestone = new Date(joining);
  milestone.setMonth(milestone.getMonth() + targetMonths);
  return (
    milestone.getFullYear() === ref.getFullYear() &&
    milestone.getMonth() === ref.getMonth()
  );
}

/**
 * Determine what appraisal (if any) is due for an employee in a given reference month.
 * Does NOT check whether a cycle already exists — caller must do that.
 */
export function getAppraisalEligibility(joiningDate: Date, ref: Date = new Date()): EligibilityResult {
  const months = monthsSince(joiningDate, ref);

  if (months < 0) return { eligible: false, reason: "Has not joined yet" };

  const isFresher = months < 12;

  if (isFresher) {
    // 6-month interim milestone
    if (milestoneDueThisMonth(joiningDate, 6, ref)) {
      return {
        eligible: true,
        cycleType: "INTERIM",
        reason: "6-month milestone — Interim Appraisal",
      };
    }
    // 12-month annual
    if (milestoneDueThisMonth(joiningDate, 12, ref)) {
      return {
        eligible: true,
        cycleType: "ANNUAL",
        reason: "1-year anniversary — Annual Appraisal",
      };
    }
    return { eligible: false, reason: `${months} months since joining — not at milestone` };
  }

  // Experienced (>= 1 year) — check yearly anniversary
  const yearsSince = Math.floor(months / 12);
  for (let y = 1; y <= yearsSince + 1; y++) {
    if (milestoneDueThisMonth(joiningDate, y * 12, ref)) {
      return {
        eligible: true,
        cycleType: "ANNUAL",
        reason: `Year ${y} anniversary — Annual Appraisal`,
      };
    }
  }

  return { eligible: false, reason: "Not at anniversary month" };
}

/**
 * Non-appraisal milestone alerts (email-only, no cycle).
 */
export function getMilestoneAlert(joiningDate: Date, ref: Date = new Date()): MilestoneAlert {
  if (milestoneDueThisMonth(joiningDate, 3, ref)) {
    return { type: "EPF_ESI", label: "3-month mark — eligible for EPF/ESI enrollment" };
  }
  if (milestoneDueThisMonth(joiningDate, 6, ref)) {
    const months = monthsSince(joiningDate, ref);
    if (months < 12) {
      return { type: "TRAINING_COMPLETE", label: "6-month mark — training complete, interim appraisal due" };
    }
  }
  return null;
}

/** Derive cycle type from joining date automatically. */
export function autoCycleType(joiningDate: Date, ref: Date = new Date()): CycleType {
  const result = getAppraisalEligibility(joiningDate, ref);
  if (result.eligible) return result.cycleType;
  // Fallback: if admin forces an assign outside milestone month, default ANNUAL
  const months = monthsSince(joiningDate, ref);
  return months < 12 ? "INTERIM" : "ANNUAL";
}
