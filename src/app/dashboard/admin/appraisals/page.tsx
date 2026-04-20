"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Eye } from "lucide-react"
import { getStatusBadgeColor, getAppraisalCycleLabel } from "@/lib/utils"
import Link from "next/link"

interface Appraisal {
  id: string
  cycleMonth: number
  cycleYear: number
  status: string
  finalRating: number | null
  employee: { name: string; empId: string; department: string }
  assignment: { hr: { name: string }; tl: { name: string }; manager: { name: string } } | null
  availabilities: { status: string }[]
  ratings: { overallRating: number }[]
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function AppraisalsPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [search, setSearch] = useState("")

  async function fetchAppraisals() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMonth !== "all") params.set("month", filterMonth)
    if (filterStatus !== "all") params.set("status", filterStatus)
    const res = await fetch(`/api/appraisals?${params}`)
    const data = await res.json()
    setAppraisals(data)
    setLoading(false)
  }

  useEffect(() => { fetchAppraisals() }, [filterMonth, filterStatus])

  const filtered = appraisals.filter(
    (a) =>
      a.employee.name.toLowerCase().includes(search.toLowerCase()) ||
      a.employee.empId.toLowerCase().includes(search.toLowerCase())
  )

  const avgRating = (ratings: { overallRating: number }[]) => {
    if (!ratings.length) return null
    return (ratings.reduce((s, r) => s + r.overallRating, 0) / ratings.length).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appraisals</h1>
          <p className="text-muted-foreground mt-1">{appraisals.length} total appraisals</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAppraisals}>
          <RefreshCw size={16} className="mr-2" />Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search employee..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["PENDING","ASSIGNED","AVAILABILITY_PENDING","RATING_IN_PROGRESS","VOTING","SCHEDULED","COMPLETED"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading appraisals...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evaluators</TableHead>
                  <TableHead>Avg Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No appraisals found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{a.employee.name}</p>
                          <p className="text-xs text-muted-foreground">{a.employee.empId} · {a.employee.department}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getAppraisalCycleLabel(a.cycleMonth, a.cycleYear)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeColor(a.status)}`}>
                          {a.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {a.assignment ? (
                          <div className="text-xs space-y-0.5">
                            <div>HR: {a.assignment.hr.name}</div>
                            <div>TL: {a.assignment.tl.name}</div>
                            <div>Mgr: {a.assignment.manager.name}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-600">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {avgRating(a.ratings) ? (
                          <span className="font-semibold text-indigo-700">{avgRating(a.ratings)}/10</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/admin/appraisals/${a.id}`}>
                          <Button size="sm" variant="ghost"><Eye size={16} /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
