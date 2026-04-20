"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface AvailabilityFormProps {
  appraisalId: string
  currentStatus?: string
  isLocked?: boolean
  onSuccess?: () => void
}

export function AvailabilityForm({ appraisalId, currentStatus, isLocked, onSuccess }: AvailabilityFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (isLocked || submitted) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
        currentStatus === "AVAILABLE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}>
        {currentStatus === "AVAILABLE" ? (
          <><CheckCircle size={16} /> Available — Submitted</>
        ) : (
          <><XCircle size={16} /> Not Available — Submitted</>
        )}
      </div>
    )
  }

  async function submit(status: "AVAILABLE" | "NOT_AVAILABLE") {
    setLoading(true)
    setError("")
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appraisalId, status }),
    })
    setLoading(false)
    if (res.ok) {
      setSubmitted(true)
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to submit availability")
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-muted-foreground">Mark your availability for this appraisal:</p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => submit("AVAILABLE")}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle size={16} className="mr-2" /> Available</>}
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => submit("NOT_AVAILABLE")}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle size={16} className="mr-2" /> Not Available</>}
        </Button>
      </div>
    </div>
  )
}
