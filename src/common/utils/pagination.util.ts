import { PaginationMeta } from '../interfaces/paginated-response.interface';

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

export const normalizePagination = (
  page: number,
  limit: number,
  maxLimit = 50,
): NormalizedPagination => {
  const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(maxLimit, Math.trunc(limit)))
    : 10;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
