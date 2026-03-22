"use client";

import { useState } from "react";

export function LoadingSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      {message}
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          onClick={onDismiss}
          aria-label="Close"
        />
      )}
    </div>
  );
}

export function SkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-md-4 mb-4">
          <div
            className="card bg-dark"
            aria-busy="true"
            aria-label="Loading content"
          >
            <div
              className="card-img-top bg-secondary"
              style={{ height: "250px", animation: "pulse 2s infinite" }}
            />
            <div className="card-body">
              <div
                className="bg-secondary rounded"
                style={{ height: "20px", marginBottom: "8px", animation: "pulse 2s infinite" }}
              />
              <div
                className="bg-secondary rounded"
                style={{ height: "16px", animation: "pulse 2s infinite" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionSliderSkeleton({ cards = 5 }: { cards?: number }) {
  return (
    <div className="movie-slider-window" aria-busy="true" aria-label="Loading section">
      <div className="movie-slider-page">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="movie-card border-0 bg-transparent p-0">
            <div className="movie-poster-wrap bg-secondary" style={{ animation: "pulse 1.6s infinite" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailsPageSkeleton() {
  return (
    <main className="container py-5 mt-5" aria-busy="true" aria-label="Loading details page">
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="bg-secondary rounded" style={{ height: "675px", animation: "pulse 1.6s infinite" }} />
        </div>
        <div className="col-md-8">
          <div className="bg-secondary rounded mb-3" style={{ height: "44px", width: "60%", animation: "pulse 1.6s infinite" }} />
          <div className="bg-secondary rounded mb-2" style={{ height: "20px", width: "30%", animation: "pulse 1.6s infinite" }} />
          <div className="bg-secondary rounded mb-2" style={{ height: "18px", width: "40%", animation: "pulse 1.6s infinite" }} />
          <div className="bg-secondary rounded mb-2" style={{ height: "18px", width: "100%", animation: "pulse 1.6s infinite" }} />
          <div className="bg-secondary rounded mb-2" style={{ height: "18px", width: "95%", animation: "pulse 1.6s infinite" }} />
          <div className="bg-secondary rounded mb-4" style={{ height: "18px", width: "85%", animation: "pulse 1.6s infinite" }} />
          <div className="d-flex gap-2 mb-4">
            <div className="bg-secondary rounded" style={{ height: "40px", width: "150px", animation: "pulse 1.6s infinite" }} />
            <div className="bg-secondary rounded" style={{ height: "40px", width: "150px", animation: "pulse 1.6s infinite" }} />
          </div>
          <div className="bg-secondary rounded" style={{ height: "260px", animation: "pulse 1.6s infinite" }} />
        </div>
      </div>

      <div className="mb-5">
        <div className="bg-secondary rounded mb-3" style={{ height: "30px", width: "180px", animation: "pulse 1.6s infinite" }} />
        <div className="row g-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`cast-skeleton-${index}`} className="col-6 col-md-4 col-lg-2">
              <div className="bg-secondary rounded" style={{ height: "260px", animation: "pulse 1.6s infinite" }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function NoContentMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center py-5">
      <h4 className="text-muted">{title}</h4>
      <p className="text-secondary">{message}</p>
    </div>
  );
}

export function SmartFallback({
  title,
  message,
  icon = "fas fa-circle-info",
  actions,
  inline = false,
  variant = "info"
}: {
  title: string;
  message: string;
  icon?: string;
  actions?: React.ReactNode;
  inline?: boolean;
  variant?: "info" | "warning" | "error";
}) {
  if (inline) {
    return (
      <div className={`smart-fallback-inline smart-fallback-inline-${variant} p-3 text-center`} role="status" aria-live="polite">
        <div className="smart-fallback-title small mb-1">{title}</div>
        <div className="small text-secondary">{message}</div>
      </div>
    );
  }

  return (
    <div className={`smart-fallback-panel smart-fallback-panel-${variant}`} role="status" aria-live="polite">
      <div className={`smart-fallback-icon smart-fallback-icon-${variant}`} aria-hidden="true">
        <i className={icon} />
      </div>
      <h5 className="mb-2">{title}</h5>
      <p className="text-secondary mb-3">{message}</p>
      {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function ToastNotification({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const bgClass = {
    success: "bg-success",
    error: "bg-danger",
    info: "bg-info",
  }[type];

  return (
    <div
      className={`toast show ${bgClass} text-white position-fixed bottom-0 end-0 m-3`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ zIndex: 1050 }}
    >
      <div className="toast-body d-flex justify-content-between align-items-center">
        {message}
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
          aria-label="Close"
        />
      </div>
    </div>
  );
}

export function RatingStars({
  rating,
  size = "sm",
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClass = {
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
  }[size];

  const displayRating = hoverRating || rating;
  const roundedRating = Math.round(displayRating);

  return (
    <div className={sizeClass}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          onClick={() => interactive && onRate?.(i + 1)}
          onMouseEnter={() => interactive && setHoverRating(i + 1)}
          onMouseLeave={() => setHoverRating(0)}
          style={{
            color: i < roundedRating ? "#ffc107" : "#6c757d",
            cursor: interactive ? "pointer" : "default",
            marginRight: "2px",
          }}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : -1}
          aria-label={`${i + 1} out of 5 stars`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function Badge({
  variant = "primary",
  children,
}: {
  variant?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`badge bg-${variant}`}>
      {children}
    </span>
  );
}
