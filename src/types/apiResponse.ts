// Shared response contract — mirrored exactly on the frontend
// (src/types/apiResponse.ts) so both sides agree on shape.
export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TApiResponse<T> = {
  success: boolean;
  message: string;
  meta?: TMeta;
  data?: T;
};

export type TResponsePayload<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: TMeta;
  data?: T;
};

export type TTokenPayload = {
  userId: string;
  role: string;
};

export type TTokenType = "accessToken" | "refreshToken";

export type TDecodedToken = TTokenPayload & {
  tokenType: TTokenType;
  iat: number;
  exp: number;
};

export type TSearchMode = "insensitive" | "default";

export type TBuildQueryParams<TFilters extends Record<string, unknown>> = {
  searchTerm?: string;
  searchableFields?: (keyof TFilters extends string ? keyof TFilters : never)[];
  filters: TFilters;
  searchMode?: TSearchMode;
};

export type TFilterCondition = Record<string, unknown>;

export type TPaginationOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
};

export type TCalculatedPagination = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};