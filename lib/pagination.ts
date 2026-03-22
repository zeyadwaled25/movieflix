export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginationResponse<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function calculatePagination(
  total: number,
  currentPage: number,
  limit: number
): Omit<PaginationResponse<unknown>, "items"> {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: Math.max(1, Math.min(currentPage, totalPages)),
    totalPages: Math.max(1, totalPages),
    totalItems: total,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

export function paginateArray<T>(
  items: T[],
  page: number = 1,
  limit: number = 20
): PaginationResponse<T> {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  const totalPages = Math.ceil(items.length / limit);

  return {
    items: paginatedItems,
    currentPage: Math.max(1, Math.min(page, totalPages)),
    totalPages: Math.max(1, totalPages),
    totalItems: items.length,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
