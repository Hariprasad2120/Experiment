"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AssignmentForm } from "@/components/forms/AssignmentForm"
import { MOMForm } from "@/components/forms/MOMForm"
import { getStatusBadgeColor, getAppraisalCycleLabel, formatDate, calculateAverageRating } from "@/lib/utils"
import { ArrowLeft, UserPlus, FileText } from "lucide-react"
import Link from "next/link"

export default function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [appraisal, setAppraisal] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [momOpen, setMomOpen] = useState(false)

  async function load() {
    const [aRes, uRes] = await Promise.all([
      fetch(`/api/appraisals/${id}`),
      fetch("/api/users"),
    ])
    setAppraisal(await aRes.json())
    setUsers(await uRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>
  if (!appraisal) return <div className="text-center py-16 text-red-600">Appraisal not found</div>

  const avgRating = calculateAverageRating(appraisal.ratings ?? [])

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/appraisals">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-2" />Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{appraisal.employee?.name}</h1>
          <p className="text-muted-foreground text-sm">
            {appraisal.employee?.empId} · {appraisal.employee?.department} ·{" "}
            {getAppraisalCycleLabel(appraisal.cycleMonth, appraisal.cycleYear)}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><UserPlus size={16} className="mr-2" />
                {appraisal.assignment ? "Reassign" : "Assign"} Evaluators
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Evaluators</DialogTitle></DialogHeader>
              <AssignmentForm
                appraisalId={id}
                users={users}
                existingAssignment={appraisal.assignment ? {
                  hrId: appraisal.assignment.hrId,
                  tlId: appraisal.assignment.tlId,
                  managerId: appraisal.assignment.managerId,
                } : undefined}
                onSuccess={() => { setAssignOpen(false); load() }}
              />
            </DialogContent>
          </Dialog>
          {["SCHEDULED", "COMPLETED"].includes(appraisal.status) && (
            <Dialog open={momOpen} onOpenChange={setMomOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><FileText size={16} className="mr-2" />
                  {appraisal.mom ? "Edit MOM" : "Create MOM"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Minutes of Meeting</DialogTitle></DialogHeader>
                <MOMForm
                  appraisalId={id}
                  existing={appraisal.mom}
                  onSuccess={() => { setMomOpen(false); load() }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Status + Rating Banner */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusBadgeColor(appraisal.status)}`}>
              {appraisal.status.replace(/_/g, " ")}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-indigo-700">{avgRating ? `${avgRating}/10` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Scheduled Date</p>
            <p className="text-sm font-semibold">
              {appraisal.finalDate ? formatDate(appraisal.finalDate) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="votes">Votes</TabsTrigger>
          {appraisal.mom && <TabsTrigger value="mom">MOM</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Assigned Evaluators</p>
                {appraisal.assignment ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "HR", person: appraisal.assignment.hr },
                      { label: "TL", person: appraisal.assignment.tl },
                      { label: "Manager", person: appraisal.assignment.manager },
                    ].map(({ label, person }) => (
                      <div key={label} className="p-3 rounded-lg bg-gray-50 border">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded">No evaluators assigned yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {appraisal.availabilities?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No availability records yet.</p>
                ) : (
                  appraisal.availabilities?.map((av: any) => (
                    <div key={av.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{av.evaluator?.name}</p>
                        <p className="text-xs text-muted-foreground">{av.evaluator?.role}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeColor(av.status)}`}>
                        {av.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {appraisal.ratings?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ratings submitted yet.</p>
              ) : (
                appraisal.ratings?.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.evaluator?.name}</p>
                        <p className="text-xs text-muted-foreground">{r.evaluator?.role}</p>
                      </div>
                      <span className="text-lg font-bold text-indigo-700">{r.overallRating}/10</span>
                    </div>
                    {r.criteria && (
                      <div className="grid grid-cols-2 gap-1">
                        {(r.criteria as {name:string;score:number}[]).map((c) => (
                          <div key={c.name} className="flex justify-between text-xs text-muted-foreground">
                            <span>{c.name}</span><span>{c.score}/10</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.comment && <p className="text-xs text-gray-600 italic">"{r.comment}"</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="votes" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              {appraisal.votes?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No votes submitted yet.</p>
              ) : (
                appraisal.votes?.map((v: any) => (
                  <div key={v.id} className="flex justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{v.evaluator?.name}</p>
                      <p className="text-xs text-muted-foreground">{v.evaluator?.role}</p>
                    </div>
                    <p className="text-sm font-medium">{formatDate(v.selectedDate)}</p>
                  </div>
                ))
              )}
              {appraisal.suggestedDate && (
                <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="text-sm text-indigo-700 font-medium">
                    Suggested date (most votes): {formatDate(appraisal.suggestedDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {appraisal.mom && (
          <TabsContent value="mom" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Final Rating</p>
                    <p className="text-2xl font-bold text-green-700">
                      {appraisal.mom.finalRating ? `${appraisal.mom.finalRating}/10` : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Increment</p>
                    <p className="text-2xl font-bold text-blue-700">{appraisal.mom.increment ?? "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Meeting Notes</p>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">{appraisal.mom.content}</div>
                </div>
                <p className="text-xs text-muted-foreground">Created by: {appraisal.mom.createdBy?.name}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
