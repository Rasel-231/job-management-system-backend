import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DisputeService } from "./dispute.service";

const createDispute = catchAsync(async (req: Request, res: Response) => {
  const result = await DisputeService.createDispute(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Dispute created. An admin will review it.",
    data: result,
  });
});

const getMyDisputes = catchAsync(async (req: Request, res: Response) => {
  const result = await DisputeService.getMyDisputes(req.user!.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disputes retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllDisputes = catchAsync(async (req: Request, res: Response) => {
  const result = await DisputeService.getAllDisputes(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disputes retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const resolveDispute = catchAsync(async (req: Request, res: Response) => {
  const result = await DisputeService.resolveDispute(req.params.id, req.body.status, req.body.resolution);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dispute resolved successfully",
    data: result,
  });
});

export const DisputeController = {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  resolveDispute,
};