import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../utils/AppError";
import { hasPermission, Permission } from "../../config/permissions";
import { TaskService } from "./task.service";

const createTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.createTask(req.user!.userId, req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Task submitted successfully",
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

const getSingleTask = catchAsync(async (req: Request, res: Response) => {
  const task = await TaskService.getSingleTask(req.params.id);

  const isOwner = task.userId === req.user!.userId;
  const isAdmin = hasPermission(req.user!.role, Permission.TASK_VIEW_ALL);
  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You do not have permission to view this task");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task retrieved successfully",
    data: task,
  });
});

const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.updateTaskStatus(req.params.id, req.body.status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Task ${result.status.toLowerCase()} successfully`,
    data: result,
  });
});

export const TaskController = { createTask, getAllTasks, getMyTasks, getSingleTask, updateTaskStatus };
