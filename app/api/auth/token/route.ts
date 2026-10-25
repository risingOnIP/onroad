import { NextResponse } from 'next/server';
import { getAuthToken } from '../../../actions/general';

export async function GET() {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
       { status: 500 }
    );
  }
}