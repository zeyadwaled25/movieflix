"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, type User } from "@/lib/auth";
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist";
import { ToastNotification } from "@/components/UIComponents";
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

  const handleRemove = async (item: WatchlistItem) => {
    await removeFromWatchlist(item.id, item.mediaType);
    setItems(await getWatchlist());
    setToast({ type: "success", message: `Removed ${item.title} from My List` });
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
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

    if (!isValidEmail(email)) {
      setToast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    event.currentTarget.reset();
    setToast({ type: "success", message: "Thanks! We will get back to you soon." });
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
              <span className="text-light me-3">Welcome, {user?.name ?? "User"}</span>
              <button className="btn btn-outline-danger auth-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" /> Logout
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
          <div className="alert alert-secondary">Your watchlist is empty. Add titles from the home page.</div>
        ) : filteredItems.length === 0 ? (
          <div className="alert alert-warning">No movies found in My List matching &quot;{searchTerm}&quot;.</div>
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
    </>
  );
}