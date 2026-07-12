import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TransactionService } from "./transaction.service";

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getAllTransactions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transactions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyEarningsSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getMyEarningsSummary(req.user!.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earnings summary retrieved successfully",
    data: result,
  });
});

export const TransactionController = { getAllTransactions, getMyEarningsSummary };
