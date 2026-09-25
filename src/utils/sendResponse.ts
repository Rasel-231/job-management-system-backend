import { Response } from "express";
import { TResponsePayload } from "../types/apiResponse";

const sendResponse = <T>(res: Response, payload: TResponsePayload<T>): void => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    meta: payload.meta,
    data: payload.data,
  });
};

export default sendResponse;
