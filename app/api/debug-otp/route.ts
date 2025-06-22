import { NextRequest, NextResponse } from 'next/server';
import { otpManager } from '@/lib/otp-manager';

export async function GET() {
  const storageInfo = otpManager.getStorageInfo();
  return NextResponse.json({
    message: 'OTP Debug Info',
    storage: storageInfo,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG OTP API ===');
    
    const body = await request.json();
    console.log('Debug request body:', body);
    
    return NextResponse.json({
      success: true,
      received: body,
      storage: otpManager.getStorageInfo(),
      message: 'Debug endpoint working'
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error.toString()
    }, { status: 500 });
  }
}