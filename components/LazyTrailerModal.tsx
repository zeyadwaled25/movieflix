"use client";

type LazyTrailerModalProps = {
  trailerKey: string;
  onClose: () => void;
};

export function LazyTrailerModal({ trailerKey, onClose }: LazyTrailerModalProps) {
  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div className="custom-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="modal-title text-white mb-0">Movie Trailer</h5>
          <button className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
        </div>
        <div className="ratio ratio-16x9">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}`}
            title="Movie Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
