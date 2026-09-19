import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TaskService } from "./task.service";

const applyForJob = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.applyForJob(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Application submitted. Awaiting the job poster's acceptance.",
    data: result,
  });
});

const acceptApplication = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.acceptApplication(req.params.id, req.user!.userId, req.user!.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Application accepted — progress tracking unlocked",
    data: result,
  });
});

const completeStep = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.completeStep(req.user!.userId, req.body.stepId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Step completed — overall progress ${result?.progress ?? 0}%`,
    data: result,
  });
});

const submitProof = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.submitProof(req.user!.userId, req.params.id, req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Proof submitted. Waiting for the job poster's approval.",
    data: result,
  });
});

const reviewTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.reviewTask(
    req.params.id,
    req.user!.userId,
    req.user!.role,
    req.body.status,
    req.body.note
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      req.body.status === "APPROVED"
        ? "Task approved — reward credited to the seeker's wallet"
        : "Task rejected",
    data: result,
  });
});

const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getAllTasks(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getMyTasks(req.user!.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your tasks retrieved successfully",
    data: result,
  });
});

const getJobApplications = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getJobApplications(
    req.params.jobId,
    req.user!.userId,
    req.user!.role
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applications retrieved successfully",
    data: result,
  });
});

const getSingleTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getSingleTask(req.params.id, req.user!.userId, req.user!.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

export const TaskController = {
  applyForJob,
  acceptApplication,
  completeStep,
  submitProof,
  reviewTask,
  getAllTasks,
  getMyTasks,
  getJobApplications,
  getSingleTask,
};