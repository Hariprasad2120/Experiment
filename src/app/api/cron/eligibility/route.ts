import { NextRequest, NextResponse } from "next/server"
import { detectEligibleEmployees } from "@/lib/appraisal-engine"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await detectEligibleEmployees()
  return NextResponse.json({ success: true, ...result })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await detectEligibleEmployees()
  return NextResponse.json({ success: true, ...result })
}
