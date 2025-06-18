import { type NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function GET(request: NextRequest) {
  try {
    const jobMarkets = await AIService.scanJobMarkets()
    return NextResponse.json({ markets: jobMarkets })
  } catch (error) {
    console.error("Error scanning job markets:", error)
    return NextResponse.json({ error: "Failed to scan job markets" }, { status: 500 })
  }
}
