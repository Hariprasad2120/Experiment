import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getAppraisalCycleLabel(month: number, year: number): string {
  const date = new Date(year, month - 1)
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800",
    HR: "bg-blue-100 text-blue-800",
    TL: "bg-green-100 text-green-800",
    MANAGER: "bg-orange-100 text-orange-800",
    EMPLOYEE: "bg-gray-100 text-gray-800",
  }
  return colors[role] ?? "bg-gray-100 text-gray-800"
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    AVAILABILITY_PENDING: "bg-orange-100 text-orange-800",
    RATING_IN_PROGRESS: "bg-indigo-100 text-indigo-800",
    VOTING: "bg-cyan-100 text-cyan-800",
    SCHEDULED: "bg-violet-100 text-violet-800",
    COMPLETED: "bg-green-100 text-green-800",
    AVAILABLE: "bg-green-100 text-green-800",
    NOT_AVAILABLE: "bg-red-100 text-red-800",
  }
  return colors[status] ?? "bg-gray-100 text-gray-800"
}

export function calculateAverageRating(ratings: { overallRating: number }[]): number | null {
  if (ratings.length === 0) return null
  const sum = ratings.reduce((acc, r) => acc + r.overallRating, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

export function getVoteWinner(votes: { selectedDate: Date }[]): Date | null {
  if (votes.length === 0) return null
  const counts = new Map<string, number>()
  for (const vote of votes) {
    const key = vote.selectedDate.toISOString()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let maxCount = 0
  let winner: string | null = null
  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      winner = key
    }
  }
  return winner ? new Date(winner) : null
}
