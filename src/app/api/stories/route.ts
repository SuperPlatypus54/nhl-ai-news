import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type NHLStory = {
  id: number;
  headline: string;
  gameDate: string;
  status: string;
  story: string;
  teams: {
    away: { name: string, score: number },
    home: { name: string, score: number }
  };
  createdAt: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD or 'today'
    
    let targetDate = date;
    if (!targetDate || targetDate === 'today') {
      targetDate = new Date().toISOString().split('T')[0];
    }

    // Get story IDs for the given date
    const indexKey = `stories:${targetDate}`;
    const storyIds = await kv.smembers(indexKey);

    if (!storyIds || storyIds.length === 0) {
      return NextResponse.json({ stories: [], date: targetDate });
    }

    // Fetch all stories for this date
    const stories: NHLStory[] = [];
    for (const storyId of storyIds) {
      const storyKey = `story:${storyId}`;
      const storyData = await kv.get(storyKey);
      if (storyData) {
        stories.push(JSON.parse(typeof storyData === 'string' ? storyData : JSON.stringify(storyData)));
      }
    }

    return NextResponse.json({ stories, date: targetDate });
  } catch (err: any) {
    console.error("Error fetching stories:", err?.message ?? err);
    return NextResponse.json({ error: "Failed to fetch stories", stories: [] }, { status: 500 });
  }
}
