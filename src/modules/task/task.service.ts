import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import pick from "../../utils/pick";
import { calculatePagination, buildMeta, TPaginationOptions } from "../../utils/paginationHelper";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload";
import { TCreateTaskPayload, TTaskFilters } from "./task.interface";

const createTask = async (
  userId: string,
  payload: TCreateTaskPayload,
  file?: Express.Multer.File
) => {
  const job = await prisma.job.findUnique({ where: { id: payload.jobId } });
  if (!job) throw new AppError(404, "Job not found");

  let proofFileUrl: string | undefined;
  if (file) {
    const uploaded = await uploadBufferToCloudinary(file, "job-management/task-proofs");
    proofFileUrl = uploaded.url;
  }

  const existing = await prisma.task.findFirst({ where: { jobId: payload.jobId, userId } });

  if (existing) {
    if (existing.status === "PENDING") {
      throw new AppError(409, "You already have a pending submission for this job");
    }
    if (existing.status === "APPROVED") {
      throw new AppError(409, "You have already completed this job");
    }
    // REJECTED → resubmit by updating the same row
    return prisma.task.update({
      where: { id: existing.id },
      data: {
        submissionLink: payload.submissionLink,
        proofFileUrl: proofFileUrl ?? existing.proofFileUrl,
        status: "PENDING",
      },
    });
  }

  return prisma.task.create({
    data: { jobId: payload.jobId, userId, submissionLink: payload.submissionLink, proofFileUrl },
  });
};

const getAllTasks = async (query: Record<string, unknown>) => {
  const filters = pick(query, ["status", "jobId"]) as TTaskFilters;
  const paginationOptions = pick(query, ["page", "limit", "sortBy", "sortOrder"]) as TPaginationOptions;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const where = {
    ...(filters.status && { status: filters.status as never }),
    ...(filters.jobId && { jobId: filters.jobId }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, reward: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return { meta: buildMeta(page, limit, total), data: tasks };
};

const getMyTasks = async (userId: string) => {
  return prisma.task.findMany({
    where: { userId },
    include: { job: { select: { id: true, title: true, reward: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const getSingleTask = async (id: string) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { job: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!task) throw new AppError(404, "Task not found");
  return task;
};

// Core business logic: approving a task atomically creates the reward
// Transaction row — status change + payout never happen out of sync.
const updateTaskStatus = async (id: string, status: "PENDING" | "APPROVED" | "REJECTED") => {
  const task = await prisma.task.findUnique({ where: { id }, include: { job: true } });
  if (!task) throw new AppError(404, "Task not found");

  if (task.status !== "PENDING") {
    throw new AppError(400, `This task has already been ${task.status.toLowerCase()}`);
  }

  return prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({ where: { id }, data: { status } });

    if (status === "APPROVED") {
      await tx.transaction.create({
        data: {
          userId: task.userId,
          amount: task.job.reward,
          type: "EARNING",
          status: "COMPLETED",
        },
      });
    }

    return updatedTask;
  });
};

export const TaskService = { createTask, getAllTasks, getMyTasks, getSingleTask, updateTaskStatus };
