export type ContentBucket = "trending" | "movie" | "tv";
export type MediaType = "movie" | "tv";
type SearchMediaType = MediaType | "person";

export type MediaItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  backdrop_path?: string | null;
  poster_path?: string | null;
  media_type?: SearchMediaType;
};

export type MediaDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  episode_run_time?: number[];
  backdrop_path?: string | null;
  poster_path?: string | null;
  genres?: Genre[];
  release_date?: string;
  first_air_date?: string;
};

export type CastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

type Genre = {
  id: number;
  name: string;
};

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "56c8c008043f25732b707cc9cae710d1";
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

type TmdbImageSize =
  | "poster-sm"
  | "poster-md"
  | "poster-lg"
  | "backdrop-sm"
  | "backdrop-lg"
  | "profile-sm"
  | "profile-md";

const TMDB_IMAGE_SIZE_MAP: Record<TmdbImageSize, string> = {
  "poster-sm": "w342",
  "poster-md": "w500",
  "poster-lg": "w780",
  "backdrop-sm": "w780",
  "backdrop-lg": "w1280",
  "profile-sm": "w185",
  "profile-md": "w300"
};

const CACHE_TTL = {
  content: 10 * 60 * 1000,
  genres: 24 * 60 * 60 * 1000,
  search: 2 * 60 * 1000,
  details: 30 * 60 * 1000,
  credits: 30 * 60 * 1000,
  similar: 30 * 60 * 1000,
  trailer: 6 * 60 * 60 * 1000
} as const;

const CONTENT_TARGET_COUNT = 35;

const requestCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = requestCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    requestCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number) {
  requestCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

async function withCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  setCached(key, data, ttlMs);
  return data;
}

function toRevalidateSeconds(ttlMs: number): number {
  return Math.max(60, Math.floor(ttlMs / 1000));
}

export function getTmdbImageUrl(path: string | null | undefined, size: TmdbImageSize): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${TMDB_IMAGE_SIZE_MAP[size]}${path}`;
}

async function fetchJson<T>(url: string, ttlMs: number): Promise<T> {
  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: toRevalidateSeconds(ttlMs) }
  });
  if (!response.ok) {
    throw new Error("TMDB request failed");
  }
  return (await response.json()) as T;
}

export async function fetchContent(type: ContentBucket): Promise<MediaItem[]> {
  const endpointMap: Record<ContentBucket, string> = {
    trending: `/trending/movie/week?api_key=${API_KEY}`,
    movie: `/movie/popular?api_key=${API_KEY}`,
    tv: `/tv/popular?api_key=${API_KEY}`
  };

  try {
    const cacheKey = `content:${type}`;
    const data = await withCache(cacheKey, CACHE_TTL.content, async () => {
      const baseEndpoint = endpointMap[type];
      const withPage = (page: number) =>
        `${BASE_URL}${baseEndpoint}${baseEndpoint.includes("?") ? "&" : "?"}page=${page}`;

      const [page1, page2] = await Promise.all([
        fetchJson<{ results: MediaItem[] }>(withPage(1), CACHE_TTL.content),
        fetchJson<{ results: MediaItem[] }>(withPage(2), CACHE_TTL.content)
      ]);

      const merged = [...(page1.results ?? []), ...(page2.results ?? [])];
      const unique = new Map<number, MediaItem>();
      for (const item of merged) {
        if (!unique.has(item.id)) {
          unique.set(item.id, item);
        }
      }

      return Array.from(unique.values()).slice(0, CONTENT_TARGET_COUNT);
    });
    return data;
  } catch {
    return [];
  }
}

export async function searchMulti(query: string): Promise<MediaItem[]> {
  try {
    const encoded = encodeURIComponent(query);
    const cacheKey = `search:${query.trim().toLowerCase()}`;
    const data = await withCache(cacheKey, CACHE_TTL.search, () =>
      fetchJson<{ results: MediaItem[] }>(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encoded}`,
        CACHE_TTL.search
      )
    );

    return (data.results ?? []).filter((item) => item.media_type !== "person");
  } catch {
    return [];
  }
}

export async function getGenres(): Promise<Genre[]> {
  try {
    const data = await withCache("genres:all", CACHE_TTL.genres, async () => {
      const [movieGenres, tvGenres] = await Promise.all([
        fetchJson<{ genres: Genre[] }>(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`, CACHE_TTL.genres),
        fetchJson<{ genres: Genre[] }>(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`, CACHE_TTL.genres)
      ]);

      return [...movieGenres.genres, ...tvGenres.genres];
    });

    return data;
  } catch {
    return [];
  }
}

export async function getTrailerKey(contentId: number, mediaType: MediaType): Promise<string | null> {
  try {
    const cacheKey = `trailer:${mediaType}:${contentId}`;
    const data = await withCache(cacheKey, CACHE_TTL.trailer, () =>
      fetchJson<{ results: Array<{ type: string; key: string }> }>(
        `${BASE_URL}/${mediaType}/${contentId}/videos?api_key=${API_KEY}`,
        CACHE_TTL.trailer
      )
    );

    const trailer = (data.results ?? []).find((video) => video.type === "Trailer");
    return trailer?.key ?? null;
  } catch {
    return null;
  }
}

export function inferMediaType(item: MediaItem, fallback: MediaType = "movie"): MediaType {
  if (item.media_type === "tv" || item.name) return "tv";
  if (item.media_type === "movie" || item.title) return "movie";
  return fallback;
}

export async function getMediaDetails(id: number, mediaType: MediaType): Promise<MediaDetails | null> {
  try {
    const cacheKey = `details:${mediaType}:${id}`;
    return await withCache(cacheKey, CACHE_TTL.details, () =>
      fetchJson<MediaDetails>(`${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}`, CACHE_TTL.details)
    );
  } catch {
    return null;
  }
}

export async function getCredits(id: number, mediaType: MediaType): Promise<CastMember[]> {
  try {
    const cacheKey = `credits:${mediaType}:${id}`;
    const data = await withCache(cacheKey, CACHE_TTL.credits, () =>
      fetchJson<{ cast: CastMember[] }>(`${BASE_URL}/${mediaType}/${id}/credits?api_key=${API_KEY}`, CACHE_TTL.credits)
    );
    return data.cast ?? [];
  } catch {
    return [];
  }
}

export async function getSimilar(id: number, mediaType: MediaType): Promise<MediaItem[]> {
  try {
    const cacheKey = `similar:${mediaType}:${id}`;
    const data = await withCache(cacheKey, CACHE_TTL.similar, () =>
      fetchJson<{ results: MediaItem[] }>(`${BASE_URL}/${mediaType}/${id}/similar?api_key=${API_KEY}`, CACHE_TTL.similar)
    );
    return data.results ?? [];
  } catch {
    return [];
  }
}