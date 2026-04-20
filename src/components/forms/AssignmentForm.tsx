"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AssignmentFormProps {
  appraisalId: string
  users: User[]
  existingAssignment?: { hrId?: string; tlId?: string; managerId?: string }
  onSuccess?: () => void
}

export function AssignmentForm({ appraisalId, users, existingAssignment, onSuccess }: AssignmentFormProps) {
  const [hrId, setHrId] = useState(existingAssignment?.hrId ?? "")
  const [tlId, setTlId] = useState(existingAssignment?.tlId ?? "")
  const [managerId, setManagerId] = useState(existingAssignment?.managerId ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const hrUsers = users.filter((u) => u.role === "HR")
  const tlUsers = users.filter((u) => u.role === "TL")
  const managerUsers = users.filter((u) => u.role === "MANAGER")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hrId || !tlId || !managerId) {
      setError("Please select all three evaluators.")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appraisalId, hrId, tlId, managerId }),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save assignment")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">Evaluators assigned successfully!</p>}

      <div className="space-y-2">
        <Label>HR Evaluator</Label>
        <Select value={hrId} onValueChange={setHrId}>
          <SelectTrigger><SelectValue placeholder="Select HR" /></SelectTrigger>
          <SelectContent>
            {hrUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Team Lead (TL)</Label>
        <Select value={tlId} onValueChange={setTlId}>
          <SelectTrigger><SelectValue placeholder="Select TL" /></SelectTrigger>
          <SelectContent>
            {tlUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Manager</Label>
        <Select value={managerId} onValueChange={setManagerId}>
          <SelectTrigger><SelectValue placeholder="Select Manager" /></SelectTrigger>
          <SelectContent>
            {managerUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</> : "Assign Evaluators"}
      </Button>
    </form>
  )
}
