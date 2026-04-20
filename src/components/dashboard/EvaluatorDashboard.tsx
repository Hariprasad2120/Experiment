"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AvailabilityForm } from "@/components/forms/AvailabilityForm"
import { RatingForm } from "@/components/forms/RatingForm"
import { VoteForm } from "@/components/forms/VoteForm"
import { getStatusBadgeColor, getAppraisalCycleLabel, calculateAverageRating } from "@/lib/utils"
import { CheckSquare, Star, Calendar } from "lucide-react"

interface EvaluatorDashboardProps {
  role: string
  userId: string
}

export function EvaluatorDashboard({ role, userId }: EvaluatorDashboardProps) {
  const [appraisals, setAppraisals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch("/api/appraisals")
    setAppraisals(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const getMyAvailability = (a: any) =>
    a.availabilities?.find((av: any) => av.evaluatorId === userId)

  const getMyRating = (a: any) =>
    a.ratings?.find((r: any) => r.evaluatorId === userId)

  const getMyVote = (a: any) =>
    a.votes?.find((v: any) => v.evaluatorId === userId)

  const totalAssigned = appraisals.length
  const availabilitySubmitted = appraisals.filter((a) => getMyAvailability(a)?.isLocked).length
  const ratingsSubmitted = appraisals.filter((a) => getMyRating(a)?.isLocked).length
  const votesSubmitted = appraisals.filter((a) => getMyVote(a)).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{role} Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your assigned employee appraisals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Assigned", value: totalAssigned, color: "bg-indigo-50 text-indigo-700" },
          { label: "Availability Done", value: availabilitySubmitted, color: "bg-green-50 text-green-700" },
          { label: "Ratings Done", value: ratingsSubmitted, color: "bg-blue-50 text-blue-700" },
          { label: "Votes Cast", value: votesSubmitted, color: "bg-purple-50 text-purple-700" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading assigned appraisals...</div>
      ) : appraisals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No appraisals assigned to you yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appraisals.map((appraisal) => {
            const myAvail = getMyAvailability(appraisal)
            const myRating = getMyRating(appraisal)
            const myVote = getMyVote(appraisal)
            const avgRating = calculateAverageRating(appraisal.ratings ?? [])

            return (
              <Card key={appraisal.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{appraisal.employee?.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {appraisal.employee?.empId} · {appraisal.employee?.department} ·{" "}
                        {getAppraisalCycleLabel(appraisal.cycleMonth, appraisal.cycleYear)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {avgRating && (
                        <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                          Avg: {avgRating}/10
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeColor(appraisal.status)}`}>
                        {appraisal.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Availability */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckSquare size={16} className="text-green-600" />
                        Availability
                      </div>
                      <AvailabilityForm
                        appraisalId={appraisal.id}
                        currentStatus={myAvail?.status}
                        isLocked={myAvail?.isLocked}
                        onSuccess={load}
                      />
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Star size={16} className="text-yellow-500" />
                        Rating
                      </div>
                      {["RATING_IN_PROGRESS", "VOTING", "SCHEDULED", "COMPLETED"].includes(appraisal.status) ? (
                        myRating?.isLocked ? (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-700">
                            Rating submitted: <strong>{myRating.overallRating}/10</strong>
                          </div>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full">Submit Rating</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Rate {appraisal.employee?.name}</DialogTitle>
                              </DialogHeader>
                              <RatingForm
                                appraisalId={appraisal.id}
                                existingRating={myRating}
                                onSuccess={load}
                              />
                            </DialogContent>
                          </Dialog>
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground p-3 bg-gray-50 rounded">
                          Available once all evaluators confirm availability.
                        </p>
                      )}
                    </div>

                    {/* Vote */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar size={16} className="text-blue-600" />
                        Vote for Date
                      </div>
                      {["VOTING", "SCHEDULED"].includes(appraisal.status) ? (
                        <VoteForm
                          appraisalId={appraisal.id}
                          hasVoted={!!myVote}
                          selectedDate={myVote?.selectedDate}
                          onSuccess={load}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground p-3 bg-gray-50 rounded">
                          Available after all ratings are submitted.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
