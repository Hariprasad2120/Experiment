"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getAppraisalCycleLabel } from "@/lib/utils"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const YEARS = [2023, 2024, 2025, 2026]

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterYear, setFilterYear] = useState("all")

  async function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMonth !== "all") params.set("month", filterMonth)
    if (filterYear !== "all") params.set("year", filterYear)
    if (search) params.set("search", search)
    const res = await fetch(`/api/reports?${params}`)
    setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [filterMonth, filterYear])

  const avgRating = (ratings: {overallRating: number}[]) => {
    if (!ratings?.length) return null
    return (ratings.reduce((s, r) => s + r.overallRating, 0) / ratings.length).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & History</h1>
        <p className="text-muted-foreground mt-1">View completed appraisal records</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or ID..."
          className="max-w-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); fetchData() }}
        />
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i+1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Avg Rating</TableHead>
                  <TableHead>Final Rating</TableHead>
                  <TableHead>Increment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No completed appraisals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{a.employee?.name}</p>
                          <p className="text-xs text-muted-foreground">{a.employee?.empId}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{a.employee?.department}</Badge></TableCell>
                      <TableCell className="text-sm">{getAppraisalCycleLabel(a.cycleMonth, a.cycleYear)}</TableCell>
                      <TableCell className="font-semibold text-indigo-700">
                        {avgRating(a.ratings) ? `${avgRating(a.ratings)}/10` : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">
                        {a.mom?.finalRating ? `${a.mom.finalRating}/10` : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-700">
                        {a.mom?.increment ?? "—"}
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
