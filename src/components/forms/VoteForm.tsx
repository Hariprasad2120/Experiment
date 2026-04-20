"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface VoteFormProps {
  appraisalId: string
  hasVoted?: boolean
  selectedDate?: string
  onSuccess?: () => void
}

export function VoteForm({ appraisalId, hasVoted, selectedDate, onSuccess }: VoteFormProps) {
  const [date, setDate] = useState(selectedDate ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (hasVoted || success) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
        <Calendar size={16} />
        <span>Voted for: <strong>{date ? formatDate(date) : "—"}</strong></span>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) { setError("Please select a date"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appraisalId, selectedDate: date }),
    })
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to submit vote")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="vote-date">Select preferred appraisal date</Label>
        <Input
          id="vote-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>
      <Button type="submit" disabled={loading} size="sm">
        {loading ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Submitting...</> : "Submit Vote"}
      </Button>
    </form>
  )
}
