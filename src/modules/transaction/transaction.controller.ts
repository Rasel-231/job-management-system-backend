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
  const result = await TransactionService.getMyEarningsSummary(req.user!.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earnings summary retrieved successfully",
    data: result,
  });
});

const requestWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.requestWithdrawal(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Withdrawal request submitted. Awaiting admin review.",
    data: result,
  });
});

const getMyWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getMyWithdrawals(req.user!.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Withdrawals retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getAllWithdrawals(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Withdrawals retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const reviewWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.reviewWithdrawal(req.params.id, req.body.status, req.body.adminNote);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      req.body.status === "COMPLETED"
        ? "Withdrawal completed — payout recorded"
        : "Withdrawal request rejected",
    data: result,
  });
});

export const TransactionController = {
  getAllTransactions,
  getMyEarningsSummary,
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  reviewWithdrawal,
};