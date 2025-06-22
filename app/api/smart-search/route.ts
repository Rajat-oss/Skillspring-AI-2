import { NextRequest, NextResponse } from 'next/server';
import { GenkitAIService } from '@/lib/genkit-ai-service';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    const genkitAI = new GenkitAIService();
    const response = await genkitAI.smartApplicationSearch(query);

    return NextResponse.json({ 
      success: true,
      response 
    });
  } catch (error) {
    console.error('Smart search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}