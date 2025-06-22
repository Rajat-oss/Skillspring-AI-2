
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const language = searchParams.get('language')

    // Build query parameters
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (category) params.append('category', category)
    if (level) params.append('level', level)
    if (language) params.append('language', language)

    const response = await fetch(`http://localhost:8000/learning/free-resources?${params}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching free resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch free resources' },
      { status: 500 }
    )
  }
}
