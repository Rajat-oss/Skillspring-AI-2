import { type NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { requirements } = await request.json()
    const candidates = await AIService.matchCandidates(requirements)
    return NextResponse.json({ candidates })
  } catch (error) {
    console.error("Error matching candidates:", error)
    return NextResponse.json({ error: "Failed to match candidates" }, { status: 500 })
  }
}
