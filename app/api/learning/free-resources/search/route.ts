
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const level = searchParams.get('level')

    if (!q) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 })
    }

    // Build query parameters
    const params = new URLSearchParams()
    params.append('q', q)
    if (category) params.append('category', category)
    if (level) params.append('level', level)

    const response = await fetch(`http://localhost:8000/learning/free-resources/search?${params}`, {
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
    console.error('Error in real-time search:', error)
    return NextResponse.json(
      { error: 'Failed to search resources' },
      { status: 500 }
    )
  }
}
