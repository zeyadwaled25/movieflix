import type { Metadata } from "next";
import type { MediaType } from "@/lib/tmdb";
import { getMediaDetails, getTmdbImageUrl } from "@/lib/tmdb";

interface Props {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://movieflix.com";
  const { mediaType: mediaTypeParam, id } = await params;
  const mediaType = (mediaTypeParam === "tv" ? "tv" : "movie") as MediaType;
  const contentId = Number(id);

  try {
    const details = await getMediaDetails(contentId, mediaType);

    if (!details) {
      return {
        title: "Movie Details",
        description: "View details about movies and TV shows on MovieFlix"
      };
    }

    const title = details.title || details.name || "Movie Details";
    const description = details.overview || "View details about this movie or TV show";
    const image = getTmdbImageUrl(details.poster_path, "poster-md") ?? undefined;

    const genreKeywords = details.genres?.map((g) => g.name).filter(Boolean) ?? [];

    return {
      title,
      description,
      keywords: [title, mediaType, "streaming", "watch", ...genreKeywords],
      alternates: {
        canonical: `/details/${mediaType}/${contentId}`
      },
      openGraph: {
        type: mediaType === "movie" ? "video.movie" : "video.tv_show",
        title: `${title} on MovieFlix`,
        description,
        url: `${siteUrl}/details/${mediaType}/${contentId}`,
        images: image
          ? [
            {
              url: image,
              width: 300,
              height: 450,
              alt: title
            }
          ]
          : undefined
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} on MovieFlix`,
        description,
        images: image ? [image] : undefined
      }
    };
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return {
      title: "Movie Details",
      description: "View details about movies and TV shows on MovieFlix"
    };
  }
}

export default function DetailsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
