import { NextResponse } from "next/server";
import OpenAI from "openai";
import { kv } from "@vercel/kv";

type NHLGame = {
  gamePk: number;
  gameDate: string;
  teams: {
    away: { team: { name: string }, score: number },
    home: { team: { name: string }, score: number }
  };
  status: {
    abstractGameState: string;
    detailedState: string;
  };
};

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

async function fetchNHLGames() {
  try {
    // NHL Stats API endpoint - fetch multiple days to ensure we have games
    const today = new Date().toISOString().split('T')[0];
    
    // Use mock data in development if API is unavailable
    if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
      console.log('Using mock NHL data for testing');
      return getMockGames();
    }
    
    const response = await fetch(`https://statsapi.web.nhl.com/api/v1/schedule?startDate=${today}&endDate=${today}`, {
      headers: { 'User-Agent': 'NHL-AI-News' }
    });
    
    if (!response.ok) {
      console.error(`NHL API returned status ${response.status}`);
      return getMockGames();
    }
    
    const data = await response.json();
    
    // Collect all games from all dates in the response
    const allGames: NHLGame[] = [];
    if (data.dates) {
      for (const dateObj of data.dates) {
        if (dateObj.games) {
          allGames.push(...dateObj.games);
        }
      }
    }

    return allGames.length > 0 ? allGames : getMockGames();
  } catch (error) {
    console.error('Error fetching NHL data:', error);
    return getMockGames();
  }
}

function getMockGames(): NHLGame[] {
  return [
    {
      gamePk: 2024020001,
      gameDate: new Date().toISOString(),
      teams: {
        away: { team: { name: 'Toronto Maple Leafs' }, score: 4 },
        home: { team: { name: 'Montreal Canadiens' }, score: 3 }
      },
      status: {
        abstractGameState: 'Final',
        detailedState: 'Final'
      }
    },
    {
      gamePk: 2024020002,
      gameDate: new Date().toISOString(),
      teams: {
        away: { team: { name: 'Boston Bruins' }, score: 2 },
        home: { team: { name: 'New York Rangers' }, score: 5 }
      },
      status: {
        abstractGameState: 'Final',
        detailedState: 'Final'
      }
    },
    {
      gamePk: 2024020003,
      gameDate: new Date().toISOString(),
      teams: {
        away: { team: { name: 'Colorado Avalanche' }, score: 6 },
        home: { team: { name: 'Los Angeles Kings' }, score: 2 }
      },
      status: {
        abstractGameState: 'Final',
        detailedState: 'Final'
      }
    }
  ];
}

function generateHeadline(game: NHLGame): string {
  const { teams, status } = game;
  const { home, away } = teams;
  
  if (status.abstractGameState === 'Final') {
    const winner = home.score > away.score ? home : away;
    const loser = home.score > away.score ? away : home;
    const scoreDiff = Math.abs(home.score - away.score);
    
    if (scoreDiff === 1) {
      return `${winner.team.name} edge ${loser.team.name} in tight ${winner.score}-${loser.score} battle`;
    } else if (scoreDiff >= 3) {
      return `${winner.team.name} dominate ${loser.team.name} ${winner.score}-${loser.score}`;
    } else {
      return `${winner.team.name} defeat ${loser.team.name} ${winner.score}-${loser.score}`;
    }
  } else if (status.abstractGameState === 'Live') {
    return `${away.team.name} vs ${home.team.name} - Live Updates`;
  } else {
    return `${away.team.name} face off against ${home.team.name} tonight`;
  }
}

export async function POST(req: Request) {
  try {
    const games = await fetchNHLGames();
    if (!games.length) {
      return NextResponse.json({ error: "No NHL games found for today" }, { status: 404 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    // Generate stories for all games (Final first, then Live, then Upcoming)
    const finalGames = games.filter(game => game.status.abstractGameState === 'Final');
    const liveGames = games.filter(game => game.status.abstractGameState === 'Live');
    const upcomingGames = games.filter(game => game.status.abstractGameState === 'Preview').slice(0, 2); // Limit upcoming to 2
    
    const gamesToProcess = [...finalGames, ...liveGames, ...upcomingGames];

    if (!gamesToProcess.length) {
      return NextResponse.json({ 
        stories: [],
        message: "No games available right now. Check back later!"
      });
    }

    const stories: NHLStory[] = await Promise.all(
      gamesToProcess.map(async (game) => {
        const headline = generateHeadline(game);
        
        let prompt = "";
        if (game.status.abstractGameState === 'Final') {
          prompt = `You are a professional NHL sports journalist. Write a concise, engaging recap article about this completed game:
          ${game.teams.away.team.name} ${game.teams.away.score} vs ${game.teams.home.team.name} ${game.teams.home.score}

          Write in ESPN.com style with:
          - A catchy headline
          - 3-4 short paragraphs
          - Focus on key plays and momentum shifts
          - Include plausible quotes from players/coaches
          - Mention any notable stats or streaks
          - Keep it factual but engaging
          Length: about 250-300 words.`;
        } else if (game.status.abstractGameState === 'Live') {
          prompt = `You are a professional NHL sports journalist. Write a live-game update article about this ongoing game:
          ${game.teams.away.team.name} ${game.teams.away.score} vs ${game.teams.home.team.name} ${game.teams.home.score}
          Status: ${game.status.detailedState}

          Write in ESPN.com live-update style with:
          - Current score and time in game
          - Momentum and key developments so far
          - Notable performances
          - What to watch for in remaining periods
          Length: about 200-250 words.`;
        } else {
          prompt = `You are a professional NHL sports journalist. Write a preview article for this upcoming game:
          ${game.teams.away.team.name} vs ${game.teams.home.team.name}
          Time: ${new Date(game.gameDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET

          Write in ESPN.com preview style with:
          - Team form and recent performance
          - Key players to watch
          - Historical matchup info
          - Predictions and storylines
          Length: about 200-250 words.`;
        }

        const resp = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        });

        return {
          id: game.gamePk,
          headline,
          gameDate: game.gameDate,
          status: game.status.abstractGameState,
          story: resp.choices?.[0]?.message?.content ?? "",
          teams: {
            away: { name: game.teams.away.team.name, score: game.teams.away.score },
            home: { name: game.teams.home.team.name, score: game.teams.home.score }
          },
          createdAt: new Date().toISOString()
        };
      })
    );

    // Save each story to KV with today's date as key
    const today = new Date().toISOString().split('T')[0];
    for (const story of stories) {
      const storyKey = `story:${story.id}:${today}`;
      await kv.set(storyKey, JSON.stringify(story), { ex: 60 * 60 * 24 * 365 }); // Keep for 1 year
    }

    // Add story IDs to the daily index
    const indexKey = `stories:${today}`;
    const storyIds = stories.map(s => `${s.id}:${today}`);
    for (const storyId of storyIds) {
      await kv.sadd(indexKey, storyId);
    }

    return NextResponse.json({ stories });
  } catch (err: any) {
    console.error("NHL API or story generation error:", err?.message ?? err);
    return NextResponse.json({ error: "Failed to fetch games or generate stories" }, { status: 500 });
  }
}