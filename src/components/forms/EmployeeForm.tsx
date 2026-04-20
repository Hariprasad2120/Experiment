"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmployeeFormProps {
  onSuccess?: () => void
}

export function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    empId: "",
    name: "",
    email: "",
    department: "",
    joiningDate: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      onSuccess?.()
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to add employee")
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 font-medium">Employee added successfully!</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="empId">Employee ID</Label>
          <Input id="empId" value={form.empId} onChange={(e) => set("empId", e.target.value)} placeholder="EMP001" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="empName">Full Name</Label>
          <Input id="empName" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="empEmail">Email</Label>
        <Input id="empEmail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@company.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dept">Department</Label>
        <Input id="dept" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Engineering" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="joiningDate">Joining Date</Label>
        <Input id="joiningDate" type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} required />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Employee"}
      </Button>
    </form>
  )
}
