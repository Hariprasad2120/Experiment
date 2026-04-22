import { addDays, isWeekend } from "date-fns";

export function addBusinessDays(date: Date, days: number): Date {
  let d = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    d = addDays(d, 1);
    if (!isWeekend(d)) remaining -= 1;
  }
  return d;
}

export function isAnniversaryInMonth(joiningDate: Date, ref: Date): boolean {
  return joiningDate.getMonth() === ref.getMonth();
}

export function daysUntilAnniversary(joiningDate: Date, ref: Date): number {
  const next = new Date(ref.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());
  if (next < ref) next.setFullYear(next.getFullYear() + 1);
  return Math.ceil((next.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}
