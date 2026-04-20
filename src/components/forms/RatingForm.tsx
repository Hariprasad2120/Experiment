"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const CRITERIA = [
  "Technical Skills",
  "Communication",
  "Teamwork",
  "Problem Solving",
  "Punctuality & Reliability",
  "Initiative & Innovation",
]

interface RatingFormProps {
  appraisalId: string
  isLocked?: boolean
  existingRating?: { criteria: { name: string; score: number }[]; overallRating: number; comment?: string }
  onSuccess?: () => void
}

export function RatingForm({ appraisalId, isLocked, existingRating, onSuccess }: RatingFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    existingRating
      ? Object.fromEntries(existingRating.criteria.map((c) => [c.name, c.score]))
      : Object.fromEntries(CRITERIA.map((c) => [c, 5]))
  )
  const [comment, setComment] = useState(existingRating?.comment ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const overallRating = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / CRITERIA.length) * 10) / 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const criteria = CRITERIA.map((name) => ({ name, score: scores[name] }))
    const res = await fetch("/api/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appraisalId, criteria, overallRating, comment }),
    })
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      onSuccess?.()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to submit rating")
    }
  }

  if (isLocked || success) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 font-medium text-sm">Rating submitted successfully.</p>
        {existingRating && (
          <div className="mt-2 space-y-1">
            {existingRating.criteria.map((c) => (
              <div key={c.name} className="flex justify-between text-sm">
                <span className="text-gray-600">{c.name}</span>
                <span className="font-medium">{c.score}/10</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t">
              <span>Overall</span>
              <span>{existingRating.overallRating}/10</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

      <div className="space-y-3">
        {CRITERIA.map((criterion) => (
          <div key={criterion} className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-sm">{criterion}</Label>
              <span className="text-sm font-semibold text-indigo-600 w-8 text-right">{scores[criterion]}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={scores[criterion]}
              onChange={(e) => setScores((prev) => ({ ...prev, [criterion]: parseInt(e.target.value) }))}
              className="w-full accent-indigo-600"
            />
          </div>
        ))}
      </div>

      <div className="p-3 bg-indigo-50 rounded-lg flex justify-between items-center">
        <span className="text-sm font-medium text-indigo-700">Calculated Overall Rating</span>
        <span className="text-xl font-bold text-indigo-700">{overallRating}/10</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comments (optional)</Label>
        <Textarea
          id="comment"
          placeholder="Add your feedback and observations..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Rating"}
      </Button>
    </form>
  )
}
