import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ClipboardList, CheckCircle, Clock, Calendar, AlertCircle } from "lucide-react"
import { getStatusBadgeColor, getAppraisalCycleLabel, formatDate } from "@/lib/utils"
import Link from "next/link"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

  const [
    totalEmployees,
    totalAppraisals,
    pendingAssignments,
    completed,
    inProgress,
    scheduled,
    recentAppraisals,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.appraisal.count(),
    prisma.appraisal.count({ where: { status: "PENDING" } }),
    prisma.appraisal.count({ where: { status: "COMPLETED" } }),
    prisma.appraisal.count({
      where: { status: { in: ["ASSIGNED", "AVAILABILITY_PENDING", "RATING_IN_PROGRESS", "VOTING"] } },
    }),
    prisma.appraisal.count({ where: { status: "SCHEDULED" } }),
    prisma.appraisal.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        employee: { select: { name: true, empId: true, department: true } },
        assignment: true,
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Appraisal Management System Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Total Employees" value={totalEmployees} icon={<Users size={20} />} color="blue" />
        <StatsCard title="Total Appraisals" value={totalAppraisals} icon={<ClipboardList size={20} />} color="purple" />
        <StatsCard title="Pending Assignment" value={pendingAssignments} icon={<AlertCircle size={20} />} color="orange" />
        <StatsCard title="In Progress" value={inProgress} icon={<Clock size={20} />} color="blue" />
        <StatsCard title="Scheduled" value={scheduled} icon={<Calendar size={20} />} color="purple" />
        <StatsCard title="Completed" value={completed} icon={<CheckCircle size={20} />} color="green" />
      </div>

      {/* Recent Appraisals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Appraisals</CardTitle>
          <Link href="/dashboard/admin/appraisals" className="text-sm text-indigo-600 hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAppraisals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No appraisals yet.</p>
            ) : (
              recentAppraisals.map((appraisal: (typeof recentAppraisals)[number]) => (
                <Link
                  key={appraisal.id}
                  href={`/dashboard/admin/appraisals/${appraisal.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {appraisal.employee.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{appraisal.employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {appraisal.employee.empId} · {appraisal.employee.department} ·{" "}
                        {getAppraisalCycleLabel(appraisal.cycleMonth, appraisal.cycleYear)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!appraisal.assignment && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Needs Assignment</span>
                    )}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeColor(appraisal.status)}`}>
                      {appraisal.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Add Employee", href: "/dashboard/admin/employees", color: "bg-indigo-600 hover:bg-indigo-700" },
          { label: "View Appraisals", href: "/dashboard/admin/appraisals", color: "bg-green-600 hover:bg-green-700" },
          { label: "View Reports", href: "/dashboard/admin/reports", color: "bg-purple-600 hover:bg-purple-700" },
          { label: "Manage Users", href: "/dashboard/admin/users", color: "bg-orange-600 hover:bg-orange-700" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} text-white text-center text-sm font-medium py-3 px-4 rounded-lg transition-colors`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
