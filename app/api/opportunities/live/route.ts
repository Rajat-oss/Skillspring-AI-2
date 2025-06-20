
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const location = searchParams.get('location')
    const platform = searchParams.get('platform')

    let url = 'http://0.0.0.0:8000/opportunities/live'
    const params = new URLSearchParams()
    
    if (domain) params.append('domain', domain)
    if (location) params.append('location', location)
    if (platform) params.append('platform', platform)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`)
      
      // Return fallback data for better UX
      const fallbackData = {
        jobs: [
          {
            id: "fallback_job_1",
            title: "Software Engineer",
            company: "TechCorp",
            location: "Remote",
            type: "job",
            posted_date: new Date().toISOString(),
            apply_url: "#",
            tags: ["Software", "Remote", "Engineering"],
            description: "Software engineering position...",
            salary: "₹6-12 LPA",
            platform: "Various",
            is_open: true,
            relevance_score: 7.5
          }
        ],
        internships: [
          {
            id: "fallback_intern_1",
            title: "Software Development Intern",
            company: "StartupABC",
            location: "Bangalore",
            type: "internship",
            posted_date: new Date().toISOString(),
            apply_url: "#",
            tags: ["Internship", "Software", "Startup"],
            description: "Software development internship...",
            salary: "₹20,000/month",
            platform: "Various",
            is_open: true,
            relevance_score: 8.0
          }
        ],
        hackathons: [
          {
            id: "fallback_hack_1",
            title: "Tech Innovation Hackathon",
            company: "TechEvents",
            location: "Online",
            type: "hackathon",
            posted_date: new Date().toISOString(),
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            apply_url: "#",
            tags: ["Innovation", "Online", "Tech"],
            description: "Innovation hackathon...",
            prize_money: "₹50,000",
            platform: "Various",
            is_open: true,
            relevance_score: 7.8
          }
        ],
        last_updated: new Date().toISOString(),
        total_count: { jobs: 1, internships: 1, hackathons: 1 },
        is_fallback: true
      }
      
      return NextResponse.json({
        status: "success",
        data: fallbackData,
        message: "Showing sample opportunities (live fetch failed)"
      })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching live opportunities:', error)
    
    // Always return some data for better UX
    const errorFallbackData = {
      jobs: [],
      internships: [],
      hackathons: [],
      last_updated: new Date().toISOString(),
      total_count: { jobs: 0, internships: 0, hackathons: 0 },
      is_fallback: true
    }
    
    return NextResponse.json({
      status: "success",
      data: errorFallbackData,
      message: "Unable to fetch live opportunities at the moment",
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
