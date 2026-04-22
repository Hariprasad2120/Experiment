import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteEmployeeAction } from "./actions";
import { toTitleCase } from "@/lib/utils";
import { FadeIn } from "@/components/motion-div";
import { UserPlus } from "lucide-react";
import { canBeAppraised } from "@/lib/rbac";

export default async function EmployeesPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ employeeNumber: "asc" }, { name: "asc" }],
    include: {
      salary: true,
      cyclesAsEmployee: {
        where: { status: { notIn: ["CLOSED", "DECIDED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, type: true },
      },
    },
  });

  const employees = users.filter((u) => canBeAppraised(u.role));
  const others = users.filter((u) => !canBeAppraised(u.role));

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

      <FadeIn delay={0.1}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appraisable Staff ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Emp #</th>
                    <th className="px-4 font-medium">Name</th>
                    <th className="px-4 font-medium">Department</th>
                    <th className="px-4 font-medium">Designation</th>
                    <th className="px-4 font-medium">Joining</th>
                    <th className="px-4 font-medium">Gross/yr</th>
                    <th className="px-4 font-medium">Active Cycle</th>
                    <th className="px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.map((u) => {
                    const activeCycle = u.cyclesAsEmployee[0];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors align-middle">
                        <td className="py-3 px-4 text-slate-500">{u.employeeNumber ?? "—"}</td>
                        <td className="px-4 font-medium text-slate-900 dark:text-white">{toTitleCase(u.name)}</td>
                        <td className="px-4 text-slate-500 text-xs">{u.department ?? "—"}</td>
                        <td className="px-4 text-slate-500 text-xs">{u.designation ?? "—"}</td>
                        <td className="px-4 text-slate-500">{u.joiningDate.toLocaleDateString()}</td>
                        <td className="px-4 text-slate-600">
                          {u.salary ? `₹${Number(u.salary.grossAnnum).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4">
                          {activeCycle ? (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full px-2 py-0.5">
                              {activeCycle.type} · {activeCycle.status.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-4">
                          <div className="flex gap-3 items-center flex-wrap">
                            <Link
                              href={`/admin/employees/${u.id}`}
                              className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/employees/${u.id}/edit`}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/employees/${u.id}/assign`}
                              className="text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                              {activeCycle ? "Manage" : "Assign"}
                            </Link>
                            <form action={deleteEmployeeAction}>
                              <input type="hidden" name="id" value={u.id} />
                              <button
                                type="submit"
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Management / Partners ({others.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-medium">Emp #</th>
                    <th className="px-4 font-medium">Name</th>
                    <th className="px-4 font-medium">Role</th>
                    <th className="px-4 font-medium">Department</th>
                    <th className="px-4 font-medium">Email</th>
                    <th className="px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {others.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{u.employeeNumber ?? "—"}</td>
                      <td className="px-4 font-medium text-slate-900 dark:text-white">{toTitleCase(u.name)}</td>
                      <td className="px-4">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-2 py-0.5">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 text-slate-500 text-xs">{u.department ?? "—"}</td>
                      <td className="px-4 text-slate-400 text-xs">{u.email}</td>
                      <td className="px-4">
                        <div className="flex gap-3">
                          <Link href={`/admin/employees/${u.id}`} className="text-xs text-slate-500 hover:text-slate-700 font-medium">View</Link>
                          <Link href={`/admin/employees/${u.id}/edit`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</Link>
                          <form action={deleteEmployeeAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
