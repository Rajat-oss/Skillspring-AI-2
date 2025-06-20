
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context } = body

    // Get auth token from headers
    const authHeader = request.headers.get('authorization')
    
    // Forward request to backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://0.0.0.0:8000'}/ai/chat/student-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || ''
      },
      body: JSON.stringify({ message, context })
    })

    if (!response.ok) {
      throw new Error('Backend API error')
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json(
      { error: 'AI assistant temporarily unavailable' },
      { status: 500 }
    )
  }
}
