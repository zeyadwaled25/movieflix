"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getCurrentUser, logoutUser, type User } from "@/lib/auth";
import {
  getCredits,
  getMediaDetails,
  getTmdbImageUrl,
  getSimilar,
  getTrailerKey,
  type CastMember,
  type MediaDetails,
  type MediaItem,
  type MediaType
} from "@/lib/tmdb";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";
import { DetailsPageSkeleton, RatingStars, ToastNotification } from "@/components/UIComponents";

const LazyTrailerEmbed = dynamic(
  () => import("@/components/LazyTrailerEmbed").then((mod) => mod.LazyTrailerEmbed),
  { ssr: false }
);

export default function DetailsPage() {
  const router = useRouter();
  const params = useParams<{ mediaType: string; id: string }>();

  const mediaType = (params.mediaType === "tv" ? "tv" : "movie") as MediaType;
  const contentId = Number(params.id);

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<MediaItem[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [inList, setInList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!Number.isFinite(contentId)) {
        router.replace("/");
        return;
      }

      setIsLoading(true);
      const [detailsResponse, castResponse, similarResponse, key] = await Promise.all([
        getMediaDetails(contentId, mediaType),
        getCredits(contentId, mediaType),
        getSimilar(contentId, mediaType),
        getTrailerKey(contentId, mediaType)
      ]);

      setDetails(detailsResponse);
      setCast(castResponse.slice(0, 12));
      setSimilar(similarResponse.slice(0, 8));
      setTrailerKey(key);
      setInList(await isInWatchlist(contentId, mediaType));
      setUser(user);

      // Track view for personalization via API
      if (detailsResponse) {
        await fetch("/api/personalization/view-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId: contentId,
            mediaType
          })
        }).catch(err => console.error("Failed to track view:", err));
      }

      setIsLoading(false);
    };

    void loadData();
  }, [contentId, mediaType, router]);

  const title = useMemo(() => details?.title || details?.name || "Details", [details]);

  const handleWatchlistToggle = async () => {
    if (!details) return;

    const saved = await toggleWatchlist({
      id: details.id,
      mediaType,
      title,
      posterPath: details.poster_path ?? null,
      voteAverage: details.vote_average
    });
    setInList(saved);
    setToast({
      message: saved ? "Added to My List" : "Removed from My List",
      type: "success"
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRating = async (rating: number) => {
    if (!details) return;

    try {
      const response = await fetch("/api/personalization/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: details.id,
          mediaType,
          rating
        })
      });

      if (response.ok) {
        setUserRating(rating);
        setToast({
          message: `Rated: ${rating}/5`,
          type: "success"
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Failed to save rating:", error);
      setToast({
        message: "Failed to save rating",
        type: "error"
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  const handleNewsletterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToast({
      message: "Successfully subscribed to newsletter!",
      type: "success"
    });
    setTimeout(() => setToast(null), 3000);
    e.currentTarget.reset();
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !subject || !message) {
      setToast({ type: "error", message: "Please complete all contact fields." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    event.currentTarget.reset();
    setToast({ type: "success", message: "Thank you for your message! We will get back to you soon." });
  };

  if (isLoading) {
    return <DetailsPageSkeleton />;
  }

  if (!details) {
    return (
      <main className="container py-5 mt-5">
        <div className="alert alert-danger">Unable to load this title.</div>
        <Link href="/" className="btn btn-outline-light">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container">
          <a className="navbar-brand text-danger fw-bold fs-3" href="#home">
            MOVIEFLIX
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" href="/">
                  Home
                </Link>
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
            <div className="d-flex align-items-center mt-2 mt-lg-0">
              {user && <span className="text-light me-3">Welcome, {user.name}</span>}
              <button className="btn btn-outline-danger auth-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-5 mt-5">
        {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="row g-4">
          <div className="col-md-4">
            <Image
              src={getTmdbImageUrl(details.poster_path, "poster-lg") ?? "https://placehold.co/300x450?text=No+Poster"}
              alt={title}
              width={450}
              height={675}
              className="img-fluid rounded"
            />
          </div>
          <div className="col-md-8">
            <h1 className="text-danger mb-3">{title}</h1>
            <p className="text-secondary mb-2">
              {(details.release_date || details.first_air_date || "Unknown release").slice(0, 4)}
            </p>
            <p className="mb-3">⭐ {details.vote_average.toFixed(1)} ({details.vote_count} votes)</p>
            <div className="mb-3">
              <p className="mb-2">Your Rating:</p>
              <RatingStars rating={userRating || 0} onRate={handleRating} interactive />
            </div>
            <p className="mb-3">{details.overview || "No overview available."}</p>
            <p className="mb-4">Genres: {details.genres?.map((g) => g.name).join(" • ") || "N/A"}</p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <button className="btn btn-danger" onClick={handleWatchlistToggle}>
                {inList ? "Remove from My List" : "Add to My List"}
              </button>
              <Link href="/my-list" className="btn btn-outline-light">
                Go to My List
              </Link>
              <Link href="/" className="btn btn-outline-secondary">
                Back to Home
              </Link>
            </div>

            {trailerKey ? (
              <LazyTrailerEmbed trailerKey={trailerKey} title={title} />
            ) : (
              <p className="text-secondary">Trailer not available.</p>
            )}
          </div>
        </div>

        <section className="mt-5">
          <h3 className="mb-3">Top Cast</h3>
          <div className="row g-3">
            {cast.length === 0 ? <p className="text-secondary">No cast data available.</p> : null}
            {cast.map((member) => (
              <div key={member.id} className="col-6 col-md-4 col-lg-2">
                <div className="card bg-dark text-white h-100 border-secondary">
                  <Image
                    src={getTmdbImageUrl(member.profile_path, "profile-md") ?? "https://placehold.co/200x300?text=No+Photo"}
                    alt={member.name}
                    width={200}
                    height={300}
                    className="card-img-top"
                  />
                  <div className="card-body p-2">
                    <p className="mb-1 small fw-bold">{member.name}</p>
                    <p className="mb-0 small text-secondary">{member.character || ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="mb-3">Similar Titles</h3>
          <div className="row g-4">
            {similar.length === 0 ? <p className="text-secondary">No similar titles found.</p> : null}
            {similar.map((item) => {
              const itemType: MediaType = item.name && !item.title ? "tv" : "movie";
              return (
                <div key={`${itemType}-${item.id}`} className="col-6 col-md-3 col-lg-2">
                  <Link href={`/details/${itemType}/${item.id}`} className="text-decoration-none text-white">
                    <div className="movie-card">
                      <Image
                        src={getTmdbImageUrl(item.poster_path, "poster-md") ?? "https://placehold.co/300x450?text=No+Poster"}
                        alt={item.title || item.name || "Similar title"}
                        width={300}
                        height={450}
                        className="img-fluid rounded"
                      />
                      <div className="movie-card-overlay text-start">
                        <h6 className="movie-card-title">{item.title || item.name}</h6>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <section id="contact" className="contact-section py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <h2 className="text-center mb-4">Contact Us</h2>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label htmlFor="name">Name</label>
                      <input name="name" type="text" id="name" className="form-control contact mt-1" required />
                    </div>
                    <div className="form-group mb-3">
                      <label htmlFor="email">Email</label>
                      <input name="email" type="email" id="email" className="form-control contact mt-1" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <input name="subject" type="text" id="subject" className="form-control contact mt-1" required />
                    </div>
                  </div>
                  <div className="col-md-6 d-flex flex-column">
                    <div className="form-group flex-grow-1 mt-3 mt-md-0">
                      <label htmlFor="message">Message</label>
                      <textarea name="message" id="message" className="form-control contact h-75 mt-1" required />
                    </div>
                    <button type="submit" className="btn btn-danger w-100 mt-3">
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
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
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <a href="#contact">Contact Us</a>
                </li>
                <li>
                  <Link href="/my-list">My List</Link>
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
                  <input type="email" className="form-control" placeholder="Your email" required />
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
    </>
  );
}