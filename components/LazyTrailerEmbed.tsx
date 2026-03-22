"use client";

type LazyTrailerEmbedProps = {
  trailerKey: string;
  title: string;
};

export function LazyTrailerEmbed({ trailerKey, title }: LazyTrailerEmbedProps) {
  return (
    <div className="ratio ratio-16x9 rounded overflow-hidden border border-secondary">
      <iframe
        src={`https://www.youtube.com/embed/${trailerKey}`}
        title={`${title} trailer`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
