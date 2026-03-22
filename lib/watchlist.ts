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

function toggleLocalWatchlist(item: WatchlistItem): boolean {
  const items = readLocalWatchlist();
  const index = items.findIndex((entry) => entry.id === item.id && entry.mediaType === item.mediaType);

  if (index >= 0) {
    items.splice(index, 1);
    writeLocalWatchlist(items);
    return false;
  }

  items.unshift(item);
  writeLocalWatchlist(items);
  return true;
}

function removeLocalWatchlistItem(id: number, mediaType: MediaType) {
  const items = readLocalWatchlist().filter((entry) => !(entry.id === id && entry.mediaType === mediaType));
  writeLocalWatchlist(items);
}

export type ToggleWatchlistResult =
  | { ok: true; saved: boolean }
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

      if (response.status >= 500) {
        const saved = toggleLocalWatchlist(item);
        return { ok: true, saved };
      }

      return {
        ok: false,
        message: payload?.message || "Failed to update your watchlist."
      };
    }

    const data = (await response.json()) as { saved: boolean };
    // Keep local cache aligned with server truth.
    const localSaved = toggleLocalWatchlist(item);
    if (localSaved !== Boolean(data.saved)) {
      toggleLocalWatchlist(item);
    }
    return { ok: true, saved: Boolean(data.saved) };
  } catch {
    const saved = toggleLocalWatchlist(item);
    return { ok: true, saved };
  }
}

export async function removeFromWatchlist(id: number, mediaType: MediaType) {
  try {
    const response = await fetch(`/api/watchlist?id=${id}&mediaType=${mediaType}`, {
      method: "DELETE"
    });

    if (!response.ok && response.status >= 500) {
      removeLocalWatchlistItem(id, mediaType);
    }
  } catch {
    removeLocalWatchlistItem(id, mediaType);
  }
}