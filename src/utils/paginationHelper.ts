import { TCalculatedPagination, TPaginationOptions, TMeta } from "../types/apiResponse";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT_FIELD = "createdAt";

export const calculatePagination = (
  options: TPaginationOptions,
  allowedSortFields: string[] = []
): TCalculatedPagination => {
  const parsedPage = Number(options.page);
  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : DEFAULT_PAGE;

  const parsedLimit = Number(options.limit);
  const rawLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : DEFAULT_LIMIT;
  const limit = Math.min(rawLimit, MAX_LIMIT);

  const skip = (page - 1) * limit;

  const requestedSortBy = options.sortBy?.trim();
  const sortBy =
    requestedSortBy &&
      (allowedSortFields.length === 0 || allowedSortFields.includes(requestedSortBy))
      ? requestedSortBy
      : DEFAULT_SORT_FIELD;

  const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

  return { page, limit, skip, sortBy, sortOrder };
};

export const buildMeta = (page: number, limit: number, total: number): TMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
});