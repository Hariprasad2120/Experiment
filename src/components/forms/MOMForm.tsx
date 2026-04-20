"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface MOMFormProps {
  appraisalId: string
  existing?: { content: string; finalRating?: number | null; increment?: string | null }
  onSuccess?: () => void
}

export function MOMForm({ appraisalId, existing, onSuccess }: MOMFormProps) {
  const [content, setContent] = useState(existing?.content ?? "")
  const [finalRating, setFinalRating] = useState(String(existing?.finalRating ?? ""))
  const [increment, setIncrement] = useState(existing?.increment ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { setError("MOM content is required"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/mom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appraisalId,
        content,
        finalRating: finalRating ? parseFloat(finalRating) : undefined,
        increment: increment || undefined,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to create MOM")
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 font-medium">MOM created and appraisal marked as completed.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="mom-content">Minutes of Meeting</Label>
        <Textarea
          id="mom-content"
          placeholder="Document the meeting discussion, decisions, and outcomes..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="final-rating">Final Rating (1–10)</Label>
          <Input
            id="final-rating"
            type="number"
            min={1}
            max={10}
            step={0.1}
            placeholder="e.g. 7.5"
            value={finalRating}
            onChange={(e) => setFinalRating(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="increment">Increment / Hike</Label>
          <Input
            id="increment"
            type="text"
            placeholder="e.g. 15% or ₹10,000"
            value={increment}
            onChange={(e) => setIncrement(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving MOM...</> : "Create MOM & Complete Appraisal"}
      </Button>
    </form>
  )
}
