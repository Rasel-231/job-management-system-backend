import { Response } from "express";

export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TResponsePayload<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: TMeta;
  data?: T;
};

const sendResponse = <T>(res: Response, payload: TResponsePayload<T>): void => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    meta: payload.meta,
    data: payload.data,
  });
};

export default sendResponse;
