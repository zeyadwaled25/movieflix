"use client";

import { useEffect, useRef, useCallback } from "react";

export type InfiniteScrollProps = {
  onLoadMore: (page: number) => Promise<void>;
  isLoading: boolean;
  hasMore: boolean;
  children: React.ReactNode;
  threshold?: number;
};

export function InfiniteScroll({
  onLoadMore,
  isLoading,
  hasMore,
  children,
  threshold = 100,
}: InfiniteScrollProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        pageRef.current += 1;
        onLoadMore(pageRef.current);
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
    });

    if (sentinel.current) {
      observer.observe(sentinel.current);
    }

    return () => observer.disconnect();
  }, [handleIntersection, threshold]);

  return (
    <>
      {children}
      {hasMore && <div ref={sentinel} className="text-center py-4" />}
    </>
  );
}
