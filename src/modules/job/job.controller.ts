import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JobService } from "./job.service";

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getAllJobs(req.query, req.user?.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Jobs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getSingleJob(req.params.id, req.user?.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job retrieved successfully",
    data: result,
  });
});

const createJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.createJob(req.user!.userId, req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Job posted successfully",
    data: result,
  });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.updateJob(
    req.params.id,
    req.user!.userId,
    req.user!.role,
    req.body,
    req.file
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job updated successfully",
    data: result,
  });
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.deleteJob(req.params.id, req.user!.userId, req.user!.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job deleted successfully",
    data: result,
  });
});

const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.toggleLike(req.user!.userId, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.liked ? "Job liked" : "Job unliked",
    data: result,
  });
});

const addComment = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.addComment(req.user!.userId, req.params.id, req.body.content);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result,
  });
});

const getComments = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await JobService.getComments(req.params.id, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getMyJobs(req.user!.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your posted jobs retrieved successfully",
    data: result,
  });
});

export const JobController = {
  getAllJobs,
  getSingleJob,
  createJob,
  updateJob,
  deleteJob,
  toggleLike,
  addComment,
  getComments,
  getMyJobs,
};