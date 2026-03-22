import type { MediaType } from "@/lib/tmdb";

export type WatchlistItem = {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  voteAverage: number;
};

const LOCAL_WATCHLIST_KEY = "movieflix_watchlist_fallback";

function readLocalWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as WatchlistItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalWatchlist(items: WatchlistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(items));
}

export type ToggleWatchlistResult =
  | { ok: true; saved: boolean }
  | { ok: false; message: string };

export type WatchlistActionResult =
  | { ok: true }
  | { ok: false; message: string };

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

    if (response.ok) {
      const items = await parseList(response);
      writeLocalWatchlist(items);
      return items;
    }

    // If the backend is temporarily failing, keep the feature usable from local cache.
    if (response.status >= 500) {
      return readLocalWatchlist();
    }

    return [];
  } catch {
    return readLocalWatchlist();
  }
}

export async function isInWatchlist(id: number, mediaType: MediaType): Promise<boolean> {
  const items = await getWatchlist();
  return items.some((item) => item.id === id && item.mediaType === mediaType);
}

export async function toggleWatchlist(item: WatchlistItem): Promise<ToggleWatchlistResult> {
  try {
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        message: payload?.message || "Failed to update your watchlist."
      };
    }

    const data = (await response.json()) as { saved: boolean; items?: WatchlistItem[] };
    if (Array.isArray(data.items)) {
      writeLocalWatchlist(data.items);
    }

    return { ok: true, saved: Boolean(data.saved) };
  } catch {
    return { ok: false, message: "Failed to update your watchlist. Please try again." };
  }
}

export async function removeFromWatchlist(id: number, mediaType: MediaType): Promise<WatchlistActionResult> {
  try {
    const response = await fetch(`/api/watchlist?id=${id}&mediaType=${mediaType}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        message: payload?.message || "Failed to remove item from your watchlist."
      };
    }

    const data = (await response.json().catch(() => null)) as { items?: WatchlistItem[] } | null;
    if (data?.items && Array.isArray(data.items)) {
      writeLocalWatchlist(data.items);
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to remove item from your watchlist. Please try again." };
  }
}