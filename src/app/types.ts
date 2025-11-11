export type NHLStory = {
  id: number;
  headline: string;
  gameDate: string;
  status: string;
  story: string;
  teams: {
    away: { name: string; score: number };
    home: { name: string; score: number };
  };
  createdAt: string;
};

export type NHLStoriesResponse = {
  stories: NHLStory[];
  message?: string;
  date?: string;
};