"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmployeeForm } from "@/components/forms/EmployeeForm"
import { Plus, Search, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Employee {
  id: string
  empId: string
  name: string
  email: string
  department: string
  joiningDate: string
  appraisals: { status: string; cycleMonth: number; cycleYear: number }[]
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  async function fetchEmployees() {
    setLoading(true)
    const res = await fetch(`/api/employees${search ? `?search=${search}` : ""}`)
    const data = await res.json()
    setEmployees(data)
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.empId.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">{employees.length} total employees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEmployees}>
            <RefreshCw size={16} className="mr-2" />Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-2" />Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
              <EmployeeForm onSuccess={() => { setOpen(false); fetchEmployees() }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or department..."
              className="pl-10 max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Latest Appraisal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((emp) => {
                    const latest = emp.appraisals[0]
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-sm">{emp.empId}</TableCell>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{emp.department}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(emp.joiningDate)}</TableCell>
                        <TableCell>
                          {latest ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                              {latest.status.replace(/_/g, " ")} · {latest.cycleMonth}/{latest.cycleYear}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
