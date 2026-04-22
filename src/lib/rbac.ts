import type { Role } from "@/generated/prisma/enums";

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  MANAGEMENT: "/management",
  MANAGER: "/reviewer",
  HR: "/reviewer",
  TL: "/reviewer",
  EMPLOYEE: "/employee",
  PARTNER: "/partner",
};

export const REVIEWER_ROLES: Role[] = ["HR", "TL", "MANAGER"];

/** Roles that can receive an appraisal cycle. MANAGEMENT and PARTNER are excluded. */
export const NON_APPRAISABLE_ROLES: Role[] = ["MANAGEMENT", "PARTNER"];

export function canBeAppraised(role: Role): boolean {
  return !NON_APPRAISABLE_ROLES.includes(role);
}

export function isReviewer(role: Role): boolean {
  return REVIEWER_ROLES.includes(role);
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function isManagement(role: Role): boolean {
  return role === "MANAGEMENT" || role === "ADMIN";
}

export function canAccessPath(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/management")) return isManagement(role);
  if (pathname.startsWith("/reviewer")) return isReviewer(role) || isAdmin(role);
  if (pathname.startsWith("/employee")) return canBeAppraised(role);
  if (pathname.startsWith("/partner")) return role === "PARTNER" || isAdmin(role);
  if (pathname.startsWith("/history")) return true;
  return true;
}

export function assertRole(actual: Role, allowed: Role[]): void {
  if (!allowed.includes(actual)) {
    throw new Error(`Forbidden: role ${actual} not in [${allowed.join(",")}]`);
  }
}
