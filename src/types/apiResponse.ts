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
