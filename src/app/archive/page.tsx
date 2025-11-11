"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function Archive() {
  const [stories, setStories] = useState<NHLStory[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [allDates, setAllDates] = useState<string[]>([]);

  useEffect(() => {
    fetchStories(selectedDate);
  }, [selectedDate]);

  async function fetchStories(date: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories?date=${date}`);
      const data = await res.json();
      setStories(data.stories || []);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setStories([]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Latest
          </Link>
          <h1 className="text-4xl font-bold mb-2">NHL News Archive</h1>
          <p className="text-gray-400">Browse AI-generated NHL stories by date</p>
        </div>

        {/* Date Picker */}
        <div className="mb-8 bg-slate-800 p-6 rounded-lg">
          <label className="block text-sm font-semibold mb-3">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Stories */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg">
            <p className="text-gray-400">No stories found for this date</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <article
                key={story.id}
                className="bg-slate-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div className="p-6">
                  {/* Game Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-blue-600 rounded text-white">
                        {story.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(story.gameDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-3">
                      <strong>{story.teams.away.name}</strong> {story.teams.away.score} -{" "}
                      <strong>{story.teams.home.name}</strong> {story.teams.home.score}
                    </div>
                  </div>

                  {/* Headline */}
                  <h2 className="text-lg font-bold mb-3 text-white line-clamp-3">
                    {story.headline}
                  </h2>

                  {/* Story Excerpt */}
                  <p className="text-gray-400 text-sm line-clamp-4 mb-4">
                    {story.story}
                  </p>

                  {/* Read More Button */}
                  <button
                    onClick={() => {
                      // Could open a modal or navigate to full story
                      alert(story.story);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                  >
                    Read Full Story →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700 text-center text-gray-400">
          <p>
            {stories.length} {stories.length === 1 ? "story" : "stories"} found for{" "}
            {new Date(selectedDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
