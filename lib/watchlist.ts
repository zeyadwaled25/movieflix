import type { MediaType } from "@/lib/tmdb";

export type WatchlistItem = {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  voteAverage: number;
};

async function parseList(response: Response): Promise<WatchlistItem[]> {
  if (!response.ok) return [];
  try {
    const data = (await response.json()) as { items: WatchlistItem[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const response = await fetch("/api/watchlist", { method: "GET" });
    return parseList(response);
  } catch {
    return [];
  }
}

export async function isInWatchlist(id: number, mediaType: MediaType): Promise<boolean> {
  const items = await getWatchlist();
  return items.some((item) => item.id === id && item.mediaType === mediaType);
}

export async function toggleWatchlist(item: WatchlistItem): Promise<boolean> {
  try {
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });

    if (!response.ok) return false;
    const data = (await response.json()) as { saved: boolean };
    return Boolean(data.saved);
  } catch {
    return false;
  }
}

export async function removeFromWatchlist(id: number, mediaType: MediaType) {
  try {
    await fetch(`/api/watchlist?id=${id}&mediaType=${mediaType}`, {
      method: "DELETE"
    });
  } catch {
    // noop
  }
}