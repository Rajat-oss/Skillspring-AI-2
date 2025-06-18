import { type NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { userType, email } = await request.json()

    let insights: string
    if (userType === "individual") {
      insights = await AIService.generateCareerInsights(email)
    } else {
      insights = await AIService.generateStartupInsights(email)
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
