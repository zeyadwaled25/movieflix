"use client";

import Link from "next/link";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  baseUrl?: string;
  isLink?: boolean;
  maxVisiblePages?: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl,
  isLink = false,
  maxVisiblePages = 5,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="d-flex justify-content-center py-4">
      <ul className="pagination">
        {/* Previous Button */}
        {isLink && baseUrl ? (
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <Link
              href={`${baseUrl}?page=${Math.max(1, currentPage - 1)}`}
              className="page-link"
            >
              Previous
            </Link>
          </li>
        ) : (
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
        )}

        {/* Page Numbers */}
        {pages.map((page, index) => (
          <li
            key={index}
            className={`page-item ${page === currentPage ? "active" : page === "..." ? "disabled" : ""
              }`}
          >
            {page === "..." ? (
              <span className="page-link">...</span>
            ) : isLink && baseUrl ? (
              <Link
                href={`${baseUrl}?page=${page}`}
                className="page-link"
              >
                {page}
              </Link>
            ) : (
              <button
                className="page-link"
                onClick={() => onPageChange(page as number)}
                disabled={page === "..."}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Next Button */}
        {isLink && baseUrl ? (
          <li
            className={`page-item ${currentPage === totalPages ? "disabled" : ""
              }`}
          >
            <Link
              href={`${baseUrl}?page=${Math.min(totalPages, currentPage + 1)}`}
              className="page-link"
            >
              Next
            </Link>
          </li>
        ) : (
          <li
            className={`page-item ${currentPage === totalPages ? "disabled" : ""
              }`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
