import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import { UserPlus, ChevronRight } from "lucide-react";

type UserWithExtras = Awaited<ReturnType<typeof loadUsers>>[number];

async function loadUsers() {
  return prisma.user.findMany({
    orderBy: [{ employeeNumber: "asc" }, { name: "asc" }],
    include: {
      salary: { select: { grossAnnum: true } },
      cyclesAsEmployee: {
        where: { status: { notIn: ["CLOSED", "DECIDED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, type: true },
      },
    },
  });
}

const SECTION_CONFIG = [
  {
    key: "PARTNER",
    label: "Directors / Partners",
    roles: ["PARTNER"],
    color: "bg-violet-100 text-violet-700",
    badgeColor: "bg-violet-100 text-violet-700",
    delay: 0.08,
  },
  {
    key: "MANAGEMENT",
    label: "Management",
    roles: ["MANAGEMENT"],
    color: "bg-indigo-100 text-indigo-700",
    badgeColor: "bg-indigo-100 text-indigo-700",
    delay: 0.12,
  },
  {
    key: "MANAGER",
    label: "Managers",
    roles: ["MANAGER"],
    color: "bg-blue-100 text-blue-700",
    badgeColor: "bg-blue-100 text-blue-700",
    delay: 0.16,
  },
  {
    key: "TL",
    label: "Team Leads",
    roles: ["TL"],
    color: "bg-amber-100 text-amber-700",
    badgeColor: "bg-amber-100 text-amber-700",
    delay: 0.20,
  },
  {
    key: "HR",
    label: "HR Staff",
    roles: ["HR"],
    color: "bg-green-100 text-green-700",
    badgeColor: "bg-green-100 text-green-700",
    delay: 0.24,
  },
  {
    key: "ADMIN",
    label: "Admins",
    roles: ["ADMIN"],
    color: "bg-red-100 text-red-700",
    badgeColor: "bg-red-100 text-red-700",
    delay: 0.28,
  },
  {
    key: "EMPLOYEE",
    label: "Staff",
    roles: ["EMPLOYEE"],
    color: "bg-slate-100 text-slate-600",
    badgeColor: "bg-slate-100 text-slate-600",
    delay: 0.32,
  },
] as const;

function EmployeeTable({ users, badgeColor, showCycle }: { users: UserWithExtras[]; badgeColor: string; showCycle: boolean }) {
  if (users.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
            <th className="py-3 px-4 font-medium">Emp #</th>
            <th className="px-4 font-medium">Name</th>
            <th className="px-4 font-medium">Role</th>
            <th className="px-4 font-medium">Department</th>
            <th className="px-4 font-medium">Location</th>
            <th className="px-4 font-medium">Joining</th>
            <th className="px-4 font-medium">Gross/yr</th>
            {showCycle && <th className="px-4 font-medium">Active Cycle</th>}
            <th className="px-4 font-medium w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => {
            const activeCycle = u.cyclesAsEmployee[0];
            return (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                <td className="py-3 px-4 text-slate-500">
                  <Link href={`/admin/employees/${u.id}`} className="block">{u.employeeNumber ?? "—"}</Link>
                </td>
                <td className="px-4">
                  <Link href={`/admin/employees/${u.id}`} className="block font-medium text-slate-900 dark:text-white hover:text-[#008993] transition-colors">
                    {toTitleCase(u.name)}
                  </Link>
                </td>
                <td className="px-4">
                  <Link href={`/admin/employees/${u.id}`} className="block">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeColor}`}>{u.role}</span>
                    {u.secondaryRole && (
                      <span className="ml-1 text-xs px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500">{u.secondaryRole}</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 text-slate-500 text-xs">
                  <Link href={`/admin/employees/${u.id}`} className="block">{u.department ?? "—"}</Link>
                </td>
                <td className="px-4 text-slate-500 text-xs">
                  <Link href={`/admin/employees/${u.id}`} className="block">{u.location ?? "—"}</Link>
                </td>
                <td className="px-4 text-slate-500">
                  <Link href={`/admin/employees/${u.id}`} className="block">
                    {u.joiningDate.toLocaleDateString()}
                  </Link>
                </td>
                <td className="px-4 text-slate-600">
                  <Link href={`/admin/employees/${u.id}`} className="block">
                    {u.salary ? `₹${Number(u.salary.grossAnnum).toLocaleString()}` : "—"}
                  </Link>
                </td>
                {showCycle && (
                  <td className="px-4">
                    <Link href={`/admin/employees/${u.id}`} className="block">
                      {activeCycle ? (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full px-2 py-0.5">
                          {activeCycle.type} · {activeCycle.status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </Link>
                  </td>
                )}
                <td className="px-4">
                  <Link href={`/admin/employees/${u.id}`} className="text-slate-400 group-hover:text-slate-600">
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function EmployeesPage() {
  const users = await loadUsers();

  const byRole = (roles: readonly string[]) => users.filter((u) => roles.includes(u.role));
  const appraisableRoles = new Set(["ADMIN", "MANAGER", "HR", "TL", "EMPLOYEE"]);

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employees</h1>
            <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
          </div>
          <Link href="/admin/employees/new">
            <Button className="flex items-center gap-2">
              <UserPlus className="size-4" /> New Employee
            </Button>
          </Link>
        </div>
      </FadeIn>

      <div className="space-y-5">
        {SECTION_CONFIG.map((sec) => {
          const group = byRole(sec.roles);
          if (group.length === 0) return null;
          const showCycle = sec.roles.some((r) => appraisableRoles.has(r));
          return (
            <FadeIn key={sec.key} delay={sec.delay}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {sec.label}
                    <span className="ml-2 text-xs font-normal text-slate-400">({group.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <EmployeeTable users={group} badgeColor={sec.badgeColor} showCycle={showCycle} />
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
