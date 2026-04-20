import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStatusBadgeColor, getAppraisalCycleLabel, formatDate } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

export default async function EmployeeDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "EMPLOYEE") redirect("/dashboard")

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id },
    include: {
      appraisals: {
        orderBy: { createdAt: "desc" },
        include: {
          assignment: {
            include: {
              hr: { select: { name: true, email: true } },
              tl: { select: { name: true, email: true } },
              manager: { select: { name: true, email: true } },
            },
          },
          availabilities: { select: { status: true, evaluatorId: true } },
          ratings: { select: { overallRating: true, evaluatorId: true, isLocked: true } },
          mom: { select: { content: true, finalRating: true, increment: true, createdAt: true } },
        },
      },
    },
  })

  if (!employee) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Appraisals</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Your employee profile is not yet linked to this account.</p>
            <p className="text-sm mt-2">Please contact HR to link your account.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestAppraisal = employee.appraisals[0]
  const avgRating = latestAppraisal?.ratings?.length
    ? (latestAppraisal.ratings.reduce((s: number, r: { overallRating: number }) => s + r.overallRating, 0) / latestAppraisal.ratings.length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{employee.name}</h1>
              <p className="text-muted-foreground text-sm">{employee.empId} · {employee.department}</p>
              <p className="text-muted-foreground text-sm">Joined: {formatDate(employee.joiningDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Appraisal Summary */}
      {latestAppraisal && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Cycle</p>
              <p className="font-semibold text-sm mt-1">
                {getAppraisalCycleLabel(latestAppraisal.cycleMonth, latestAppraisal.cycleYear)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Status</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${getStatusBadgeColor(latestAppraisal.status)}`}>
                {latestAppraisal.status.replace(/_/g, " ")}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{avgRating ? `${avgRating}/10` : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Scheduled Date</p>
              <p className="text-sm font-semibold mt-1">
                {latestAppraisal.finalDate ? formatDate(latestAppraisal.finalDate as Date) : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evaluators */}
      {latestAppraisal?.assignment && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned Evaluators</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "HR", person: latestAppraisal.assignment.hr },
                { label: "Team Lead", person: latestAppraisal.assignment.tl },
                { label: "Manager", person: latestAppraisal.assignment.manager },
              ].map(({ label, person }) => (
                <div key={label} className="p-3 rounded-lg bg-gray-50 border">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-sm">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.email}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Result (if completed) */}
      {latestAppraisal?.mom && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base text-green-800 flex items-center gap-2">
              <CheckCircle size={18} /> Appraisal Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Final Rating</p>
                <p className="text-3xl font-bold text-green-700">
                  {latestAppraisal.mom.finalRating ? `${latestAppraisal.mom.finalRating}/10` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Increment</p>
                <p className="text-3xl font-bold text-blue-700">{latestAppraisal.mom.increment ?? "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Meeting Notes</p>
              <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap">{latestAppraisal.mom.content}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Appraisals */}
      {employee.appraisals.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Appraisal History</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2">
            {employee.appraisals.slice(1).map((a: (typeof employee.appraisals)[number]) => {
              const avg = a.ratings.length
                ? (a.ratings.reduce((s: number, r: { overallRating: number }) => s + r.overallRating, 0) / a.ratings.length).toFixed(1)
                : null
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{getAppraisalCycleLabel(a.cycleMonth, a.cycleYear)}</p>
                    {a.mom && <p className="text-xs text-muted-foreground">Increment: {a.mom.increment ?? "—"}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {avg && <span className="text-sm font-semibold text-indigo-700">{avg}/10</span>}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeColor(a.status)}`}>
                      {a.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {!latestAppraisal && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No appraisal cycles initiated yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
