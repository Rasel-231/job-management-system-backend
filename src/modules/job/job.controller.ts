import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JobService } from "./job.service";

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getAllJobs(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Jobs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getSingleJob(req.params.id);

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
    message: "Job created successfully",
    data: result,
  });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.updateJob(req.params.id, req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job updated successfully",
    data: result,
  });
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
  await JobService.deleteJob(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job deleted successfully",
    data: null,
  });
});

export const JobController = { getAllJobs, getSingleJob, createJob, updateJob, deleteJob };
