
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const body = await request.json()
    const { status = 'bookmarked' } = body

    const response = await fetch(`http://0.0.0.0:8000/learning/free-resources/${params.resourceId}/bookmark?status=${status}`, {
      method: 'POST',
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
    console.error('Error bookmarking resource:', error)
    return NextResponse.json(
      { error: 'Failed to bookmark resource' },
      { status: 500 }
    )
  }
}
