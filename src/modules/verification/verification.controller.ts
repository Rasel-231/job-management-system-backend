import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { VerificationService } from "./verification.service";

const submitVerification = catchAsync(async (req: Request, res: Response) => {
  const result = await VerificationService.submitVerification(
    req.user!.userId,
    req.body,
    req.file
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Verification submitted. Awaiting admin review.",
    data: result,
  });
});

const getMyVerifications = catchAsync(async (req: Request, res: Response) => {
  const result = await VerificationService.getMyVerifications(req.user!.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verifications retrieved successfully",
    data: result,
  });
});

const getAllVerifications = catchAsync(async (req: Request, res: Response) => {
  const result = await VerificationService.getAllVerifications(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verifications retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const reviewVerification = catchAsync(async (req: Request, res: Response) => {
  const result = await VerificationService.reviewVerification(req.params.id, req.body.status, req.body.note);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verification reviewed successfully",
    data: result,
  });
});

export const VerificationController = {
  submitVerification,
  getMyVerifications,
  getAllVerifications,
  reviewVerification,
};