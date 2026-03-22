import { prisma } from "@/lib/server/prisma";
import type { MediaType } from "@/lib/tmdb";

// Personalization API for user preferences and recommendations

export async function saveUserPreference(
  userId: string,
  key: string,
  value: unknown
) {
  "use server";
  // Save user preference to preferences JSON field
  try {
    // For now, use the existing preferences API
    if (key === "theme" || key === "itemsPerPage") {
      return await prisma.userPreferences.upsert({
        where: { userId },
        update: { [key]: value },
        create: { userId, [key]: value },
      });
    }
    return null;
  } catch (error) {
    console.error("Error saving preference:", error);
    return null;
  }
}

export async function getUserPreferences(userId: string) {
  "use server";
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
    });
    return prefs || { theme: "dark", itemsPerPage: 20 };
  } catch (error) {
    console.error("Error getting preferences:", error);
    return { theme: "dark", itemsPerPage: 20 };
  }
}

export async function trackMediaView(
  userId: string,
  mediaId: number,
  mediaType: MediaType
) {
  "use server";
  try {
    return await prisma.viewHistory.create({
      data: { userId, mediaId, mediaType },
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    return null;
  }
}

export async function getUserViewHistory(userId: string, limit = 10) {
  try {
    const history = await prisma.viewHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: limit,
    });
    return history;
  } catch (error) {
    console.error("Error getting view history:", error);
    return [];
  }
}

export async function rateMedia(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
  rating: number
) {
  // rating should be 1-5
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  try {
    return await prisma.rating.upsert({
      where: {
        userId_mediaId_mediaType: { userId, mediaId, mediaType },
      },
      update: { rating },
      create: { userId, mediaId, mediaType, rating },
    });
  } catch (error) {
    console.error("Error rating media:", error);
    return null;
  }
}

export async function getUserRatings(userId: string) {
  try {
    return await prisma.rating.findMany({
      where: { userId },
      orderBy: { ratedAt: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error getting ratings:", error);
    return [];
  }
}

export async function getRecommendations(userId: string, limit = 10) {
  try {
    // Get user's view history to understand what they like
    const viewHistory = await prisma.viewHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      select: { mediaType: true },
      take: 20,
    });

    // Get user's high ratings
    const highRatings = await prisma.rating.findMany({
      where: { userId, rating: { gte: 4 } },
      select: { mediaType: true },
      take: 10,
    });

    // Determine preferred media types
    const preferredTypes: string[] = [
      ...viewHistory.map((v: { mediaType: string }) => v.mediaType),
      ...highRatings.map((r: { mediaType: string }) => r.mediaType),
    ];

    return {
      preferredTypes: [...new Set(preferredTypes)],
      viewHistoryCount: viewHistory.length,
      highRatingsCount: highRatings.length,
    };
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return { preferredTypes: [], viewHistoryCount: 0, highRatingsCount: 0 };
  }
}

export async function getSimilarUserBehavior(
  userId: string,
  limit = 5
) {
  try {
    // Get what users with similar watch history are watching
    const userHistory = await prisma.viewHistory.findMany({
      where: { userId },
      select: { mediaId: true, mediaType: true },
      take: 10,
    });

    if (userHistory.length === 0) {
      return [];
    }

    const similarMediaIds = userHistory.map((h: { mediaId: number }) => h.mediaId);

    // Find other users who watched the same content
    const similarUsers = await prisma.viewHistory.findMany({
      where: {
        mediaId: { in: similarMediaIds },
        userId: { not: userId },
      },
      distinct: ["userId"],
      take: 5,
    });

    // Get what those users watched
    const similarUserViews = await prisma.viewHistory.findMany({
      where: {
        AND: [
          { userId: { in: similarUsers.map((su: { userId: string }) => su.userId) } },
          { mediaId: { notIn: similarMediaIds } },
        ],
      },
      orderBy: { viewedAt: "desc" },
      take: limit,
    });

    return similarUserViews;
  } catch (error) {
    console.error("Error getting similar user behavior:", error);
    return [];
  }
}

// Client-side personalization utilities

export function getThemePreference() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("movieflix_theme") || "dark";
}

export function setThemePreference(theme: "light" | "dark") {
  if (typeof window === "undefined") return;
  localStorage.setItem("movieflix_theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function getItemsPerPagePreference() {
  if (typeof window === "undefined") return 20;
  return parseInt(localStorage.getItem("movieflix_items_per_page") || "20", 10);
}

export function setItemsPerPagePreference(itemsPerPage: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("movieflix_items_per_page", itemsPerPage.toString());
}

// Recommendation engine
export function calculateRecommendationScore(
  media: { id: number; genreIds?: number[] },
  userRatings: {
    mediaId: number;
    rating: number;
  }[],
  userGenrePreferences: Record<number, number>
) {
  let score = 0;

  // Score based on similar genres
  media.genreIds?.forEach((genreId) => {
    score += (userGenrePreferences[genreId] || 0) * 10;
  });

  // Boost score if highly rated by other similar users
  const hasHighRatings = userRatings.some(
    (r) => r.mediaId === media.id && r.rating >= 4
  );
  if (hasHighRatings) {
    score += 20;
  }

  return score;
}
