import { NextResponse } from "next/server";

// This endpoint is called daily by Vercel Cron to generate new stories
export async function GET(req: Request) {
  try {
    // Verify the request is from Vercel
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the generate endpoint to fetch and store new stories
    const response = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Daily stories generated',
      storiesCount: data.stories?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily stories', details: error?.message },
      { status: 500 }
    );
  }
}
