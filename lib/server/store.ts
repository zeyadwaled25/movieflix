import { prisma } from "./prisma";
import type { MediaType } from "@/lib/tmdb";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type StoredWatchlistItem = {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  voteAverage: number;
};

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string
): Promise<StoredUser> {
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      preferences: {
        create: {
          theme: "dark",
          itemsPerPage: 20,
        },
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getWatchlistByUserId(
  userId: string
): Promise<StoredWatchlistItem[]> {
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  });

  return items.map((item: {
    id: number;
    mediaType: string;
    title: string;
    posterPath: string | null;
    voteAverage: number;
  }) => ({
    id: item.id,
    mediaType: item.mediaType as MediaType,
    title: item.title,
    posterPath: item.posterPath,
    voteAverage: item.voteAverage,
  }));
}

export async function toggleWatchlistItem(
  userId: string,
  item: StoredWatchlistItem
): Promise<{ saved: boolean; items: StoredWatchlistItem[] }> {
  const existing = await prisma.watchlistItem.findUnique({
    where: {
      id_userId_mediaType: {
        id: item.id,
        userId,
        mediaType: item.mediaType,
      },
    },
  });

  if (existing) {
    // Item exists, remove it
    await prisma.watchlistItem.delete({
      where: {
        id_userId_mediaType: {
          id: item.id,
          userId,
          mediaType: item.mediaType,
        },
      },
    });

    const updated = await getWatchlistByUserId(userId);
    return { saved: false, items: updated };
  }

  // Item doesn't exist, add it
  await prisma.watchlistItem.create({
    data: {
      id: item.id,
      userId,
      mediaType: item.mediaType,
      title: item.title,
      posterPath: item.posterPath,
      voteAverage: item.voteAverage,
    },
  });

  const updated = await getWatchlistByUserId(userId);
  return { saved: true, items: updated };
}

export async function removeWatchlistItem(
  userId: string,
  id: number,
  mediaType: MediaType
): Promise<StoredWatchlistItem[]> {
  await prisma.watchlistItem.delete({
    where: {
      id_userId_mediaType: {
        id,
        userId,
        mediaType,
      },
    },
  }).catch(() => {
    // Item doesn't exist, that's fine
  });

  return getWatchlistByUserId(userId);
}

// Personalization functions

export async function getUserPreferences(userId: string) {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  return prefs || { theme: "dark", itemsPerPage: 20 };
}

export async function updateUserPreferences(
  userId: string,
  data: { theme?: string; itemsPerPage?: number }
) {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}

// View history tracking for personalization

export async function recordViewHistory(
  userId: string,
  mediaId: number,
  mediaType: MediaType
) {
  return prisma.viewHistory.create({
    data: {
      userId,
      mediaId,
      mediaType,
    },
  });
}

export async function getUserViewHistory(userId: string, limit = 20) {
  return prisma.viewHistory.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
  });
}

// Rating functions for personalization

export async function rateMedia(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
  rating: number
) {
  return prisma.rating.upsert({
    where: {
      userId_mediaId_mediaType: { userId, mediaId, mediaType },
    },
    update: { rating },
    create: { userId, mediaId, mediaType, rating },
  });
}

export async function getUserRatings(userId: string, limit = 50) {
  return prisma.rating.findMany({
    where: { userId },
    orderBy: { ratedAt: "desc" },
    take: limit,
  });
}

// Get average rating for a media item

export async function getMediaAverageRating(
  mediaId: number,
  mediaType: MediaType
) {
  const result = await prisma.rating.aggregate({
    where: { mediaId, mediaType },
    _avg: { rating: true },
    _count: true,
  });

  return {
    averageRating: result._avg.rating || 0,
    totalRatings: result._count,
  };
}