"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, type User } from "@/lib/auth";
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist";
import { SmartFallback, ToastNotification } from "@/components/UIComponents";
import { getTmdbImageUrl } from "@/lib/tmdb";

type ToastState = { type: "success" | "error" | "info"; message: string } | null;

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function MyListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [isContactSending, setIsContactSending] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.title.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const pageSize = 4;
  const pagedItems = useMemo(() => {
    const pages: WatchlistItem[][] = [];
    for (let index = 0; index < filteredItems.length; index += pageSize) {
      pages.push(filteredItems.slice(index, index + pageSize));
    }
    return pages.length > 0 ? pages : [[]];
  }, [filteredItems]);

  const totalPages = pagedItems.length;

  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      setItems(await getWatchlist());
    };

    void load();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRemove = async (item: WatchlistItem) => {
    await removeFromWatchlist(item.id, item.mediaType);
    setItems(await getWatchlist());
    setToast({ type: "success", message: `Removed ${item.title} from My List` });
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
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

  return (
    <>
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container">
          <Link className="navbar-brand text-danger fw-bold fs-3" href="/">
            MOVIEFLIX
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavMyList">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarNavMyList">
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
                <span className="nav-link active">My List</span>
              </li>
            </ul>

            <form className="d-flex me-3" onSubmit={(event) => event.preventDefault()}>
              <input
                className="form-control"
                type="search"
                placeholder="Search in My List..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </form>

            <div className="d-flex align-items-center mt-2 mt-lg-0">
              <button className="profile-badge profile-logout-btn" onClick={handleLogout}>
                <span className="profile-avatar" aria-hidden="true">
                  <i className="fas fa-user" />
                </span>
                <span className="profile-meta text-start">
                  <span className="profile-name">{user?.name ?? "User"}</span>
                  <span className="profile-logout-text">
                    <i className="fas fa-sign-out-alt me-1" /> Logout
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-5 mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
          <h1 className="text-danger mb-0">My List</h1>
          <Link href="/" className="btn btn-outline-light">
            Back to Home
          </Link>
        </div>

        {items.length === 0 ? (
          <SmartFallback
            title="Your watchlist is empty"
            message="Add movies and TV shows from the home page to build your personal list."
            icon="fas fa-bookmark"
            variant="info"
            actions={
              <Link href="/" className="btn btn-outline-danger btn-sm">
                Discover Titles
              </Link>
            }
          />
        ) : filteredItems.length === 0 ? (
          <SmartFallback
            title="No matches in your list"
            message={`We could not find titles matching "${searchTerm}".`}
            icon="fas fa-magnifying-glass"
            variant="warning"
            actions={
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setSearchTerm("")}>
                Clear Search
              </button>
            }
          />
        ) : (
          <div className="section-container movie-slider-container">
            <div className="movie-slider mylist-slider">
              <button
                className="btn prev-btn slider-control"
                onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                style={{ display: currentSlide === 0 ? "none" : "flex" }}
              >
                <i className="fas fa-chevron-left" />
              </button>

              <div className="movie-slider-window">
                <div className="movie-slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {pagedItems.map((pageItems, pageIndex) => (
                    <div key={`mylist-page-${pageIndex}`} className="mylist-slider-page">
                      {pageItems.map((item) => (
                        <div key={`${item.mediaType}-${item.id}`} className="mylist-card h-100">
                          <div className="mylist-poster-wrap">
                            <Image
                              src={getTmdbImageUrl(item.posterPath, "poster-md") ?? "https://placehold.co/300x450?text=No+Poster"}
                              alt={item.title}
                              width={300}
                              height={450}
                              className="mylist-poster"
                            />
                          </div>
                          <div className="mylist-card-body text-start">
                            <h5 className="mylist-title mb-2">{item.title}</h5>
                            <p className="mylist-rating mb-3">⭐ {item.voteAverage.toFixed(1)}</p>
                            <div className="d-flex gap-2">
                              <Link href={`/details/${item.mediaType}/${item.id}`} className="btn btn-sm btn-danger">
                                Details
                              </Link>
                              <button className="btn btn-sm btn-outline-light" onClick={() => handleRemove(item)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn next-btn slider-control"
                onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalPages - 1))}
                style={{ display: currentSlide >= totalPages - 1 ? "none" : "flex" }}
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </main>

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
                  <span>My List</span>
                </li>
              </ul>
            </div>
            <div className="col-6 col-md-4 col-lg-2 mb-4">
              <h5 className="text-white mb-4">Library</h5>
              <ul className="footer-links list-unstyled">
                <li>Saved Movies: {items.length}</li>
                <li>Filtered View: {filteredItems.length}</li>
                <li>Account: {user?.name ?? "User"}</li>
              </ul>
            </div>
            <div className="col-md-4 mb-4">
              <h5 className="text-white mb-4">Need Help?</h5>
              <p className="mb-2">Use the search box above to quickly find titles in your list.</p>
              <p className="mb-0 text-secondary">Tip: remove watched titles to keep your list clean.</p>
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
    </>
  );
}