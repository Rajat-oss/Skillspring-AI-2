import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    // Simple AI response for now
    const response = `I understand you're asking about: "${message}". I'm here to help with your career journey! Here are some suggestions:

🎯 **Career Guidance**: I can help with career path recommendations and goal setting
📚 **Learning**: Course suggestions and skill development advice  
💼 **Job Search**: Resume tips and interview preparation
📊 **Market Insights**: Industry trends and salary information

What specific area would you like to explore further?`;

    return NextResponse.json({ 
      success: true,
      response 
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}