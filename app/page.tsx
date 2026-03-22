"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getCurrentUser, logoutUser, type User } from "@/lib/auth";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";
import { SectionSliderSkeleton, SmartFallback, ToastNotification } from "@/components/UIComponents";
import {
  fetchContent,
  getGenres,
  getTmdbImageUrl,
  getTrailerKey,
  inferMediaType,
  searchMulti,
  type ContentBucket,
  type MediaItem,
  type MediaType
} from "@/lib/tmdb";

const LazyTrailerModal = dynamic(
  () => import("@/components/LazyTrailerModal").then((mod) => mod.LazyTrailerModal),
  { ssr: false }
);

type SectionMovies = Record<ContentBucket, MediaItem[]>;
type SlideState = Record<ContentBucket, number>;
type ToastState = { type: "success" | "error" | "info"; message: string } | null;

const INITIAL_SECTION_MOVIES: SectionMovies = {
  trending: [],
  movie: [],
  tv: []
};

const INITIAL_SLIDES: SlideState = {
  trending: 1,
  movie: 1,
  tv: 1
};

const CONTENT_TITLES: Record<ContentBucket, string> = {
  trending: "Trending Now",
  movie: "Popular Movies",
  tv: "Popular TV Shows"
};

const CARDS_PER_SLIDE = 5;
const SLIDE_TRANSITION_MS = 420;

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function getLocalClosestMatches(query: string, pool: MediaItem[]): MediaItem[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const unique = new Map<string, MediaItem>();
  for (const item of pool) {
    const key = `${item.media_type ?? inferMediaType(item, "movie")}-${item.id}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return Array.from(unique.values())
    .map((item) => {
      const title = normalizeText(item.title || item.name || "");
      if (!title) return { item, score: 0 };

      let score = 0;
      if (title === normalizedQuery) score += 100;
      if (title.startsWith(normalizedQuery)) score += 75;
      if (title.includes(normalizedQuery)) score += 55;

      const queryTokens = normalizedQuery.split(" ").filter(Boolean);
      for (const token of queryTokens) {
        if (title.includes(token)) score += 12;
      }

      const voteBoost = Math.min((item.vote_count ?? 0) / 500, 20);
      score += voteBoost;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.item);
}

function getPosterSrc(posterPath?: string | null, size: "small" | "large" = "large"): string {
  const placeholder = size === "small" ? "https://placehold.co/80x120?text=No+Image" : "https://placehold.co/300x450?text=No+Poster";
  if (!posterPath) return placeholder;
  return size === "small"
    ? (getTmdbImageUrl(posterPath, "poster-sm") ?? placeholder)
    : (getTmdbImageUrl(posterPath, "poster-md") ?? placeholder);
}

function PosterImage({
  posterPath,
  alt,
  width,
  height,
  className,
  size = "large"
}: {
  posterPath?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  size?: "small" | "large";
}) {
  const [src, setSrc] = useState<string>(getPosterSrc(posterPath, size));

  useEffect(() => {
    setSrc(getPosterSrc(posterPath, size));
  }, [posterPath, size]);

  const fallback = size === "small" ? "https://placehold.co/80x120?text=No+Image" : "https://placehold.co/300x450?text=No+Poster";

  return (
    <Image
      src={src}
      className={className}
      alt={alt}
      width={width}
      height={height}
      onError={() => setSrc(fallback)}
    />
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionMovies, setSectionMovies] = useState<SectionMovies>(INITIAL_SECTION_MOVIES);
  const [slides, setSlides] = useState<SlideState>(INITIAL_SLIDES);
  const [genresMap, setGenresMap] = useState<Map<number, string>>(new Map());
  const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
  const [heroType, setHeroType] = useState<MediaType>("movie");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[] | null>(null);
  const [searchSlide, setSearchSlide] = useState(1);
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isContactSending, setIsContactSending] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeType, setActiveType] = useState<ContentBucket>("trending");
  const [heroInList, setHeroInList] = useState(false);
  const [isSliding, setIsSliding] = useState<Record<ContentBucket, boolean>>({
    trending: false,
    movie: false,
    tv: false
  });
  const [slideTransitionEnabled, setSlideTransitionEnabled] = useState<Record<ContentBucket, boolean>>({
    trending: true,
    movie: true,
    tv: true
  });
  const [searchTransitionEnabled, setSearchTransitionEnabled] = useState(true);

  useEffect(() => {
    const hydrateUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
    };

    void hydrateUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      setIsLoading(true);

      try {
        const [trending, movies, tvShows, genres] = await Promise.all([
          fetchContent("trending"),
          fetchContent("movie"),
          fetchContent("tv"),
          getGenres()
        ]);

        const nextMap = new Map<number, string>();
        for (const genre of genres) {
          nextMap.set(genre.id, genre.name);
        }

        setGenresMap(nextMap);
        setSectionMovies({ trending, movie: movies, tv: tvShows });
        setSlides({
          trending: getInitialLoopIndex(trending.length),
          movie: getInitialLoopIndex(movies.length),
          tv: getInitialLoopIndex(tvShows.length)
        });
        setSlideTransitionEnabled({
          trending: true,
          movie: true,
          tv: true
        });
        const firstHero = trending[0] ?? movies[0] ?? tvShows[0] ?? null;
        setHeroItem(firstHero);
        setHeroType("movie");
        if (firstHero) {
          setHeroInList(await isInWatchlist(firstHero.id, inferMediaType(firstHero, "movie")));
        }
      } catch {
        setToast({ type: "error", message: "Failed to load content. Please try again later." });
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      const results = await searchMulti(trimmed);
      if (results.length > 0) {
        setSuggestions(results.slice(0, 8));
      } else {
        const pool = [...sectionMovies.trending, ...sectionMovies.movie, ...sectionMovies.tv];
        const fallback = getLocalClosestMatches(trimmed, pool);
        setSuggestions(fallback);
      }
      setShowSuggestions(true);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchQuery, sectionMovies]);

  const heroGenres = useMemo(() => {
    if (!heroItem?.genre_ids?.length) return "Genre information not available";

    const label = heroItem.genre_ids
      .map((id) => genresMap.get(id))
      .filter(Boolean)
      .join(" • ");

    return label || "Genre information not available";
  }, [heroItem, genresMap]);

  const contentTitle = useMemo(() => {
    if (searchResults && searchQuery.trim()) {
      return `Search Results for "${searchQuery.trim()}"`;
    }
    return CONTENT_TITLES[activeType];
  }, [activeType, searchQuery, searchResults]);

  const chunkCards = (items: MediaItem[]) => {
    const pageSize = CARDS_PER_SLIDE;
    if (items.length === 0) return [[]];

    const pages: MediaItem[][] = [];
    for (let index = 0; index < items.length; index += pageSize) {
      pages.push(items.slice(index, index + pageSize));
    }

    return pages;
  };

  const getInitialLoopIndex = (itemsCount: number) => (Math.ceil(itemsCount / CARDS_PER_SLIDE) > 1 ? 1 : 0);

  const buildLoopPages = (pages: MediaItem[][]) => {
    if (pages.length <= 1) return pages;
    return [pages[pages.length - 1], ...pages, pages[0]];
  };

  const resetToTrending = (scrollToTop = false) => {
    setSearchResults(null);
    setSearchSlide(1);
    setSearchTransitionEnabled(true);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveType("trending");

    const trendingHero = sectionMovies.trending[0];
    if (trendingHero) {
      updateHero(trendingHero, "movie");
    }

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const updateHero = (item: MediaItem, fallbackType: MediaType = "movie") => {
    setHeroItem(item);
    const itemType = inferMediaType(item, fallbackType);
    setHeroType(itemType);
    void isInWatchlist(item.id, itemType).then((saved) => setHeroInList(saved));
  };

  const handleWatchlistToggle = async () => {
    if (!heroItem) return;

    const result = await toggleWatchlist({
      id: heroItem.id,
      mediaType: heroType,
      title: heroItem.title || heroItem.name || "Untitled",
      posterPath: heroItem.poster_path ?? null,
      voteAverage: heroItem.vote_average ?? 0
    });

    if (!result.ok) {
      setToast({ type: "error", message: result.message });
      return;
    }

    setHeroInList(result.saved);
    setToast({
      type: "success",
      message: result.saved ? "Added to My List" : "Removed from My List"
    });
  };

  const handleBrandClick = () => {
    resetToTrending(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const handleNavTypeClick = (type: ContentBucket) => {
    const hadSearchMode = Boolean(searchResults) || searchQuery.trim().length > 0;
    if (hadSearchMode) {
      setSearchResults(null);
      setSearchSlide(1);
      setSearchTransitionEnabled(true);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }

    setActiveType(type);
    const nextHero = sectionMovies[type][0];
    if (nextHero) {
      updateHero(nextHero, type === "tv" ? "tv" : "movie");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const results = await searchMulti(query);
    const finalResults =
      results.length > 0
        ? results
        : getLocalClosestMatches(query, [...sectionMovies.trending, ...sectionMovies.movie, ...sectionMovies.tv]);

    if (finalResults.length === 0) {
      setToast({ type: "error", message: "No results found" });
      return;
    }

    setSearchResults(finalResults);
    setSearchSlide(getInitialLoopIndex(finalResults.length));
    setSearchTransitionEnabled(true);
    updateHero(finalResults[0]);
    setSuggestions(finalResults.slice(0, 8));
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (item: MediaItem) => {
    setSearchResults((prev) => {
      if (!prev || prev.length === 0) {
        return suggestions.length > 0 ? suggestions : [item];
      }
      return prev;
    });
    const base = suggestions.length > 0 ? suggestions.length : 1;
    setSearchSlide(getInitialLoopIndex(base));
    setSearchTransitionEnabled(true);
    updateHero(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (value.trim().length === 0) {
      resetToTrending(true);
    }
  };

  const moveSlide = (type: ContentBucket, direction: "prev" | "next") => {
    const totalPages = Math.max(1, Math.ceil(sectionMovies[type].length / CARDS_PER_SLIDE));
    if (totalPages <= 1) return;

    const current = slides[type];
    const next = direction === "next" ? current + 1 : current - 1;
    if (next === current) return;

    setIsSliding((prev) => ({ ...prev, [type]: true }));
    setSlides((prev) => ({ ...prev, [type]: next }));

    window.setTimeout(() => {
      setIsSliding((prev) => ({ ...prev, [type]: false }));

      if (next === 0 || next === totalPages + 1) {
        const resetTarget = next === 0 ? totalPages : 1;
        setSlideTransitionEnabled((prev) => ({ ...prev, [type]: false }));
        setSlides((prev) => ({ ...prev, [type]: resetTarget }));
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setSlideTransitionEnabled((prev) => ({ ...prev, [type]: true }));
          });
        });
      }
    }, SLIDE_TRANSITION_MS);
  };

  const moveSearchSlide = (direction: "prev" | "next") => {
    if (!searchResults) return;
    const totalPages = Math.max(1, Math.ceil(searchResults.length / CARDS_PER_SLIDE));
    if (totalPages <= 1) return;

    const next = direction === "next" ? searchSlide + 1 : searchSlide - 1;
    setSearchSlide(next);

    window.setTimeout(() => {
      if (next === 0 || next === totalPages + 1) {
        const resetTarget = next === 0 ? totalPages : 1;
        setSearchTransitionEnabled(false);
        setSearchSlide(resetTarget);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setSearchTransitionEnabled(true);
          });
        });
      }
    }, SLIDE_TRANSITION_MS);
  };

  const handleTrailer = async () => {
    if (!heroItem) return;

    const key = await getTrailerKey(heroItem.id, heroType);
    if (!key) {
      setToast({ type: "error", message: "Trailer not available" });
      return;
    }

    setTrailerKey(key);
  };

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("newsletterEmail") ?? "").trim();

    if (!email) {
      setToast({ type: "error", message: "Please enter your email address" });
      return;
    }

    if (!isValidEmail(email)) {
      setToast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    event.currentTarget.reset();
    setToast({ type: "success", message: "Thank you for subscribing to our newsletter!" });
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !subject || !message) {
      setToast({ type: "error", message: "Please complete all contact fields." });
      return;
    }

    if (!isValidEmail(email)) {
      setToast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    try {
      setIsContactSending(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message
        })
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setToast({ type: "error", message: data?.message || "Failed to send your message. Please try again." });
        return;
      }

      form.reset();
      setToast({ type: "success", message: "Your message was sent successfully. We will contact you shortly." });
    } catch (error) {
      console.error("Contact request failed:", error);
      setToast({ type: "error", message: "Failed to send your message. Please try again." });
    } finally {
      setIsContactSending(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container">
          <Link className="navbar-brand text-danger fw-bold fs-3" href="/" onClick={handleBrandClick}>
            MOVIEFLIX
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <button
                  className={`nav-link btn btn-link text-decoration-none ${!searchResults && activeType === "trending" ? "is-active-nav" : ""}`}
                  onClick={() => handleNavTypeClick("trending")}
                >
                  Trending
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link btn btn-link text-decoration-none ${!searchResults && activeType === "movie" ? "is-active-nav" : ""}`}
                  onClick={() => handleNavTypeClick("movie")}
                >
                  Movies
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link btn btn-link text-decoration-none ${!searchResults && activeType === "tv" ? "is-active-nav" : ""}`}
                  onClick={() => handleNavTypeClick("tv")}
                >
                  TV Shows
                </button>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contact">
                  Contact Us
                </a>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="/my-list">
                  My List
                </Link>
              </li>
            </ul>

            <form className="d-flex position-relative me-1" onSubmit={handleSearchSubmit}>
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(event) => handleSearchInputChange(event.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
              />
              <button className="btn btn-outline-danger" type="submit" aria-label="Search">
                <i className="fas fa-search" />
              </button>
              <div className="search-suggestions" style={{ display: showSuggestions ? "block" : "none" }}>
                <div className="suggestions-container">
                  {suggestions.length === 0 ? (
                    <SmartFallback
                      title="No close matches found"
                      message="Try another title keyword."
                      variant="warning"
                      inline
                    />
                  ) : null}
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="suggestion-item w-100 border-0 bg-transparent text-start"
                      onClick={() => handleSuggestionClick(item)}
                    >
                      <PosterImage
                        posterPath={item.poster_path}
                        className="suggestion-poster"
                        alt={item.title || item.name || "Suggestion"}
                        width={40}
                        height={60}
                        size="small"
                      />
                      <div className="suggestion-info">
                        <h6>{item.title || item.name}</h6>
                        <small>Voted by {item.vote_count ?? 0}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="d-flex align-items-center mt-2 mt-lg-0">
              <button className="profile-badge profile-logout-btn" onClick={handleLogout}>
                <span className="profile-avatar" aria-hidden="true">
                  <i className="fas fa-user" />
                </span>
                <span className="profile-meta text-start">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-logout-text">
                    <i className="fas fa-sign-out-alt me-1" /> Logout
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section
        id="home"
        className="hero-section"
        style={{
          backgroundImage: heroItem?.backdrop_path
            ? `url(${getTmdbImageUrl(heroItem.backdrop_path, "backdrop-lg") ?? ""})`
            : undefined
        }}
      >
        <div className="container h-100 d-flex align-items-center">
          <div className="hero-content text-white">
            <h1 className="hero-title display-4 mb-3">{heroItem?.title || heroItem?.name || "MovieFlix"}</h1>
            <span className="movie-genre text-secondary">{heroGenres}</span>
            <div className="movie-meta mt-3 mb-4">
              <span className="stars-container me-3">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starCount = Math.round((heroItem?.vote_average ?? 0) / 2);
                  return (
                    <i
                      key={index}
                      className={`fas fa-star ${index < starCount ? "text-warning" : "text-secondary"} me-1`}
                    />
                  );
                })}
              </span>
              <span className="movie-rating me-3">{(heroItem?.vote_average ?? 0).toFixed(1)}</span>
            </div>
            <p className="movie-description lead mb-4">
              {heroItem?.overview
                ? heroItem.overview.length > 200
                  ? `${heroItem.overview.slice(0, 200)}...`
                  : heroItem.overview
                : "No description available"}
            </p>
            <div className="hero-actions d-flex gap-3">
              <button className="btn btn-outline-light px-4 trailer-btn" onClick={handleTrailer}>
                <i className="fas fa-play-circle me-2" /> TRAILER
              </button>
              <a className="btn btn-danger px-4 watch-btn" href="#movies-section">
                WATCH NOW
              </a>
              <button className="btn btn-outline-danger px-4" onClick={handleWatchlistToggle}>
                {heroInList ? "REMOVE" : "ADD TO LIST"}
              </button>
              {heroItem ? (
                <Link href={`/details/${heroType}/${heroItem.id}`} className="btn btn-outline-secondary px-4">
                  DETAILS
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container my-5">
        {isLoading ? (
          (["trending", "movie", "tv"] as ContentBucket[]).map((type) => (
            <div key={`loading-${type}`} className="section-container mb-5 movie-slider-container">
              <h2 className="content-type-title mb-4">{CONTENT_TITLES[type]}</h2>
              <SectionSliderSkeleton cards={5} />
            </div>
          ))
        ) : searchResults ? (
          (() => {
            const pages = chunkCards(searchResults);
            const loopPages = buildLoopPages(pages);
            const fallbackType: MediaType = inferMediaType(searchResults[0] ?? { id: 0 }, "movie");

            return (
              <div className="section-container mb-5 movie-slider-container" id="movies-section">
                <h2 className="content-type-title mb-4">{contentTitle}</h2>
                <div className="movie-slider search-slider">
                  <button
                    className="btn prev-btn slider-control"
                    onClick={() => moveSearchSlide("prev")}
                    style={{ display: "flex" }}
                  >
                    <i className="fas fa-chevron-left" />
                  </button>

                  <div className="movie-slider-window">
                    <div
                      className="movie-slider-track"
                      style={{
                        transform: `translateX(-${searchSlide * 100}%)`,
                        transition: searchTransitionEnabled ? undefined : "none"
                      }}
                    >
                      {loopPages.map((pageItems, pageIndex) => (
                        <div key={`search-page-${pageIndex}`} className="movie-slider-page">
                          {pageItems.map((item, itemIndex) => (
                            <div
                              key={`search-${pageIndex}-${itemIndex}-${item.id}`}
                              className="movie-card border-0 bg-transparent p-0"
                            >
                              <button
                                className="movie-poster-button border-0 bg-transparent p-0"
                                onClick={() => {
                                  updateHero(item, fallbackType);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                              >
                                <div className="movie-poster-wrap">
                                  <PosterImage
                                    posterPath={item.poster_path}
                                    className="movie-poster-img"
                                    alt={item.title || item.name || "Movie"}
                                    width={300}
                                    height={450}
                                  />
                                </div>
                              </button>
                              <div className="movie-card-overlay text-start">
                                <h5 className="movie-card-title">{item.title || item.name}</h5>
                                <p className="movie-card-rating mb-2">
                                  ⭐ {item.vote_average?.toFixed(1) ?? "0.0"}{" "}
                                  <span className="text-secondary">({item.vote_count ?? 0})</span>
                                </p>
                                <Link
                                  href={`/details/${inferMediaType(item, fallbackType)}/${item.id}`}
                                  className="btn btn-sm btn-danger"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn next-btn slider-control"
                    onClick={() => moveSearchSlide("next")}
                    style={{ display: "flex" }}
                  >
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          (["trending", "movie", "tv"] as ContentBucket[]).map((type) => {
            const pages = chunkCards(sectionMovies[type]);
            const loopPages = buildLoopPages(pages);
            const page = slides[type];

            return (
              <div
                key={type}
                id={type === "movie" ? "movies-section" : type === "tv" ? "tv-shows-section" : undefined}
                className="section-container mb-5 movie-slider-container"
              >
                <h2 className="content-type-title mb-4">{type === activeType ? contentTitle : CONTENT_TITLES[type]}</h2>
                <div className={`movie-slider ${type === "movie" ? "movies-slider" : `${type}-slider`} ${isLoading ? "opacity-50" : ""}`}>
                  <button
                    className="btn prev-btn slider-control"
                    onClick={() => moveSlide(type, "prev")}
                    style={{ display: "flex" }}
                  >
                    <i className="fas fa-chevron-left" />
                  </button>
                  <div className="movie-slider-window">
                    <div
                      className={`movie-slider-track ${isSliding[type] ? "is-sliding" : ""}`}
                      style={{
                        transform: `translateX(-${page * 100}%)`,
                        transition: slideTransitionEnabled[type] ? undefined : "none"
                      }}
                    >
                      {loopPages.map((pageItems, pageIndex) => (
                        <div key={`${type}-page-${pageIndex}`} className="movie-slider-page">
                          {pageItems.map((item, itemIndex) => {
                            const itemType: MediaType = type === "tv" ? "tv" : "movie";
                            return (
                              <div key={`${type}-${pageIndex}-${itemIndex}-${item.id}`} className="movie-card border-0 bg-transparent p-0">
                                <button
                                  className="movie-poster-button border-0 bg-transparent p-0"
                                  onClick={() => {
                                    updateHero(item, itemType);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                >
                                  <div className="movie-poster-wrap">
                                    <PosterImage
                                      posterPath={item.poster_path}
                                      className="movie-poster-img"
                                      alt={item.title || item.name || "Movie"}
                                      width={300}
                                      height={450}
                                    />
                                  </div>
                                </button>
                                <div className="movie-card-overlay text-start">
                                  <h5 className="movie-card-title">{item.title || item.name}</h5>
                                  <p className="movie-card-rating mb-2">
                                    ⭐ {item.vote_average?.toFixed(1) ?? "0.0"}{" "}
                                    <span className="text-secondary">({item.vote_count ?? 0})</span>
                                  </p>
                                  <Link href={`/details/${itemType}/${item.id}`} className="btn btn-sm btn-danger">
                                    Details
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn next-btn slider-control"
                    onClick={() => moveSlide(type, "next")}
                    style={{ display: "flex" }}
                  >
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </div>
            );
          }))}
      </section>

      <section id="contact" className="contact-section py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10">
              <div className="contact-shell">
                <div className="contact-info-panel">
                  <span className="contact-badge">MovieFlix Support</span>
                  <h2 className="mb-2">Contact Us</h2>
                  <p className="contact-intro mb-4">
                    Share your feedback, report an issue, or request a title. Our support team is here to help.
                  </p>
                  <ul className="contact-points list-unstyled mb-0">
                    <li>
                      <i className="fas fa-clock" aria-hidden="true" />
                      Typical response time: within 24 hours
                    </li>
                    <li>
                      <i className="fas fa-film" aria-hidden="true" />
                      Suggestions for movies and TV shows are always welcome
                    </li>
                    <li>
                      <i className="fas fa-shield-alt" aria-hidden="true" />
                      We keep your contact details private and secure
                    </li>
                  </ul>
                </div>

                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label htmlFor="name">Name</label>
                        <input name="name" type="text" id="name" className="form-control contact mt-1" placeholder="Your full name" required />
                      </div>
                      <div className="form-group mb-3">
                        <label htmlFor="email">Email</label>
                        <input name="email" type="email" id="email" className="form-control contact mt-1" placeholder="name@example.com" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <input name="subject" type="text" id="subject" className="form-control contact mt-1" placeholder="How can we help?" required />
                      </div>
                    </div>
                    <div className="col-md-6 d-flex flex-column">
                      <div className="form-group flex-grow-1 mt-3 mt-md-0">
                        <label htmlFor="message">Message</label>
                        <textarea
                          name="message"
                          id="message"
                          className="form-control contact h-75 mt-1"
                          placeholder="Write your message here..."
                          minLength={10}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-danger w-100 mt-3 contact-submit-btn" disabled={isContactSending}>
                        {isContactSending ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-dark text-white pt-5 pb-3">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 mb-4">
              <h3 className="text-danger mb-4">MOVIEFLIX</h3>
              <p className="mb-4">
                Your ultimate destination for movies and TV shows. Stream unlimited entertainment anytime, anywhere.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/share/14w8ji3Tig/" target="_blank" rel="noreferrer" className="social-icon me-2">
                  <i className="fab fa-facebook-f" />
                </a>
                <a
                  href="https://www.instagram.com/zeyad_w_hassaballah?igsh=MWZ5ZWF4M2FnbGdueA=="
                  target="_blank"
                  rel="noreferrer"
                  className="social-icon me-2"
                >
                  <i className="fab fa-instagram" />
                </a>
                <a
                  href="https://www.linkedin.com/in/zeyad-waled-3504a9295?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                  rel="noreferrer"
                  className="social-icon me-2"
                >
                  <i className="fab fa-linkedin" />
                </a>
                <a href="https://github.com/zeyadwaled25" target="_blank" rel="noreferrer" className="social-icon">
                  <i className="fab fa-github" />
                </a>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-2 mb-4">
              <h5 className="text-white mb-4">Quick Links</h5>
              <ul className="footer-links list-unstyled">
                <li>
                  <a href="#home">Home</a>
                </li>
                <li>
                  <a href="#movies-section">Movies</a>
                </li>
                <li>
                  <a href="#tv-shows-section">TV Shows</a>
                </li>
                <li>
                  <a href="#contact">Contact Us</a>
                </li>
              </ul>
            </div>
            <div className="col-6 col-md-4 col-lg-2 mb-4">
              <h5 className="text-white mb-4">Categories</h5>
              <ul className="footer-links list-unstyled">
                <li>Action</li>
                <li>Comedy</li>
                <li>Drama</li>
                <li>Horror</li>
              </ul>
            </div>
            <div className="col-md-4 mb-4">
              <h5 className="text-white mb-4">Newsletter</h5>
              <p>Subscribe to our newsletter for updates and exclusive offers!</p>
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <div className="input-group">
                  <input name="newsletterEmail" type="email" className="form-control" placeholder="Your email" required />
                  <button className="btn btn-danger" type="submit">
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
          <hr className="mt-0" />
          <div className="text-center">
            <p className="mb-0">&copy; 2026 MovieFlix. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <i className="fas fa-chevron-up" aria-hidden="true" />
      </button>

      {trailerKey ? <LazyTrailerModal trailerKey={trailerKey} onClose={() => setTrailerKey(null)} /> : null}
    </>
  );
}