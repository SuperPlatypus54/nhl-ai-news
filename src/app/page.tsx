"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NHLStory } from "./types";

export default function Home() {
  const [stories, setStories] = useState<NHLStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchStories() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setStories(data.stories || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStories();
    // Refresh stories every 5 minutes
    const interval = setInterval(fetchStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="bg-indigo-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">NHL AI News</h1>
            <div className="flex gap-3">
              <Link
                href="/archive"
                className="rounded bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-400 transition-colors"
              >
                Archive
              </Link>
              <button
                onClick={fetchStories}
                className="rounded bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-400 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Updating..." : "Refresh"}
              </button>
            </div>
          </div>
          {lastUpdated && (
            <p className="mt-1 text-xs text-indigo-200">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading && stories.length === 0 && (
          <div className="text-center">
            <div className="animate-pulse text-lg text-zinc-400">
              Fetching latest NHL news...
            </div>
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.id}
              className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-800"
            >
              <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                {new Date(story.gameDate).toLocaleDateString()}
              </div>
              
              <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-white">
                {story.headline}
              </h2>
              
              <div className="mb-4 rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="font-medium">{story.teams.away.name}</div>
                  <div className="font-bold">
                    {story.teams.away.score} - {story.teams.home.score}
                  </div>
                  <div className="font-medium">{story.teams.home.name}</div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none dark:prose-invert">
                {story.story.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-3 text-zinc-600 dark:text-zinc-300">
                    {p}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        {!loading && stories.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              No NHL games found. Check back later for updates.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
