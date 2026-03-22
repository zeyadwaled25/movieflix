import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWatchlistByUserId, removeWatchlistItem, toggleWatchlistItem, type StoredWatchlistItem } from "@/lib/server/store";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import type { MediaType } from "@/lib/tmdb";

async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.userId || null;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const items = await getWatchlistByUserId(userId);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as StoredWatchlistItem;
  if (!body || typeof body.id !== "number" || (body.mediaType !== "movie" && body.mediaType !== "tv")) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const result = await toggleWatchlistItem(userId, {
    id: body.id,
    mediaType: body.mediaType,
    title: body.title,
    posterPath: body.posterPath ?? null,
    voteAverage: body.voteAverage ?? 0
  });

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const mediaType = url.searchParams.get("mediaType") as MediaType;

  if (!Number.isFinite(id) || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ message: "Invalid query" }, { status: 400 });
  }

  const items = await removeWatchlistItem(userId, id, mediaType);
  return NextResponse.json({ items });
}